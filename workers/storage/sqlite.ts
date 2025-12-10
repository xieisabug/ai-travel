/**
 * SQLite 存储提供者
 *
 * 使用 sql.js (纯 JavaScript SQLite) 作为本地存储后端
 * 优化的分表存储结构
 */

import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import type { World, TravelProject, TravelVehicle, Spot, SpotNPC, TravelSession, DialogScript, DialogScriptType } from '../../app/types/world';
import type { User, UserSession, UserListParams, PublicUser } from '../../app/types/user';
import type { CurrencyTransaction, CurrencyTransactionType, DailyClaimResult } from '../../app/types/currency';
import { DAILY_CLAIM_AMOUNT } from '../../app/types/currency';
import type {
    IStorageProvider,
    StorageConfig,
    ExportData,
    AICallRecord,
    AICallQueryParams,
    AICallStats,
    AICallType,
} from './types';

// ============================================
// 数据库初始化
// ============================================

let dbInstance: SqlJsDatabase | null = null;
let dbPath: string = '';
let initPromise: Promise<SqlJsDatabase> | null = null;

// ============================================
// 数据库版本和迁移系统
// ============================================

/** 当前数据库 schema 版本 */
const CURRENT_DB_VERSION = 7;

/**
 * 数据库迁移定义
 * key 是目标版本号，value 是从上一版本迁移到该版本的 SQL 语句
 */
const migrations: Record<number, string[]> = {
    // 版本 1: 初始版本（通过 createTables 创建）
    1: [],

    // 版本 2: 添加货币系统字段
    2: [
        // 添加 currency_balance 列到 users 表
        `ALTER TABLE users ADD COLUMN currency_balance INTEGER NOT NULL DEFAULT 0`,
        // 添加 last_daily_claim_date 列到 users 表
        `ALTER TABLE users ADD COLUMN last_daily_claim_date TEXT`,
        // 创建货币交易记录表
        `CREATE TABLE IF NOT EXISTS currency_transactions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            amount INTEGER NOT NULL,
            balance_after INTEGER NOT NULL,
            type TEXT NOT NULL,
            description TEXT NOT NULL,
            reference_id TEXT,
            reference_type TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        `CREATE INDEX IF NOT EXISTS idx_currency_transactions_user ON currency_transactions(user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_currency_transactions_created ON currency_transactions(created_at)`,
    ],

    // 版本 3: 世界图集
    3: [
        `ALTER TABLE worlds ADD COLUMN overview_images TEXT`,
        `ALTER TABLE worlds ADD COLUMN culture_images TEXT`,
    ],

    // 版本 4: 旅游项目背景音乐
    4: [
        `ALTER TABLE projects ADD COLUMN bgm_url TEXT`,
    ],

    // 版本 5: 景点存储 NPC 引用列表
    5: [
        `ALTER TABLE spots ADD COLUMN npc_ids TEXT`,
    ],

    // 版本 6: NPC 独立化，添加 world_id 字段，spot_id 变为可选
    6: [
        `ALTER TABLE npcs ADD COLUMN world_id TEXT`,
    ],

    // 版本 7: 重建 npcs 表，移除 spot_id 的 NOT NULL 约束
    7: [
        // 1. 创建新表（spot_id 可选）
        `CREATE TABLE IF NOT EXISTS npcs_new (
            id TEXT PRIMARY KEY,
            world_id TEXT,
            spot_id TEXT,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            description TEXT NOT NULL,
            backstory TEXT,
            personality TEXT,
            appearance TEXT,
            speaking_style TEXT,
            interests TEXT,
            sprite TEXT,
            sprites TEXT,
            greeting_dialog_id TEXT,
            dialog_options TEXT,
            generation_status TEXT NOT NULL
        )`,
        // 2. 复制数据
        `INSERT INTO npcs_new SELECT id, world_id, spot_id, name, role, description, backstory, personality, appearance, speaking_style, interests, sprite, sprites, greeting_dialog_id, dialog_options, generation_status FROM npcs`,
        // 3. 删除旧表
        `DROP TABLE npcs`,
        // 4. 重命名新表
        `ALTER TABLE npcs_new RENAME TO npcs`,
        // 5. 重建索引
        `CREATE INDEX IF NOT EXISTS idx_npcs_world ON npcs(world_id)`,
        `CREATE INDEX IF NOT EXISTS idx_npcs_spot ON npcs(spot_id)`,
    ],
};

/**
 * 获取当前数据库版本
 */
function getDbVersion(db: SqlJsDatabase): number {
    try {
        const result = db.exec(`SELECT value FROM settings WHERE key = 'db_version'`);
        if (result.length > 0 && result[0].values.length > 0) {
            return parseInt(result[0].values[0][0] as string, 10) || 0;
        }
    } catch {
        // settings 表可能不存在
    }
    return 0;
}

/**
 * 设置数据库版本
 */
function setDbVersion(db: SqlJsDatabase, version: number): void {
    db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES ('db_version', ?)`, [version.toString()]);
}

/**
 * 检查列是否存在
 */
function columnExists(db: SqlJsDatabase, tableName: string, columnName: string): boolean {
    try {
        const result = db.exec(`PRAGMA table_info(${tableName})`);
        if (result.length > 0) {
            const columns = result[0].values.map(row => row[1] as string);
            return columns.includes(columnName);
        }
    } catch {
        // 表可能不存在
    }
    return false;
}

/**
 * 检查表是否存在
 */
function tableExists(db: SqlJsDatabase, tableName: string): boolean {
    try {
        const result = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [tableName]);
        return result.length > 0 && result[0].values.length > 0;
    } catch {
        return false;
    }
}

/**
 * 运行数据库迁移
 */
function runMigrations(db: SqlJsDatabase): void {
    let currentVersion = getDbVersion(db);

    // 如果版本为 0，说明是新数据库或从未设置过版本
    // 检查 users 表是否存在来判断是否是全新数据库
    if (currentVersion === 0) {
        if (tableExists(db, 'users')) {
            // 旧数据库，从未记录版本，假设是版本 1
            console.log('[SQLite] 检测到旧数据库，设置初始版本为 1');
            setDbVersion(db, 1);
            currentVersion = 1;
        } else {
            // 全新数据库，createTables 刚创建了表，设置版本为 1
            console.log('[SQLite] 新数据库，设置初始版本为 1');
            setDbVersion(db, 1);
            currentVersion = 1;
        }
    }

    console.log(`[SQLite] 当前数据库版本: ${currentVersion}, 目标版本: ${CURRENT_DB_VERSION}`);

    if (currentVersion >= CURRENT_DB_VERSION) {
        console.log('[SQLite] 数据库已是最新版本');
        return;
    }

    console.log(`[SQLite] 开始数据库迁移: ${currentVersion} -> ${CURRENT_DB_VERSION}`);

    for (let version = currentVersion + 1; version <= CURRENT_DB_VERSION; version++) {
        const migrationSqls = migrations[version] || [];
        console.log(`[SQLite] 执行迁移到版本 ${version} (${migrationSqls.length} 条语句)`);

        for (const sql of migrationSqls) {
            try {
                // 特殊处理 ALTER TABLE ADD COLUMN - 检查列是否已存在
                const alterMatch = sql.match(/ALTER TABLE (\w+) ADD COLUMN (\w+)/i);
                if (alterMatch) {
                    const [, tableName, columnName] = alterMatch;
                    if (columnExists(db, tableName, columnName)) {
                        console.log(`[SQLite] 列 ${tableName}.${columnName} 已存在，跳过`);
                        continue;
                    }
                }

                // 特殊处理 CREATE TABLE IF NOT EXISTS
                const createTableMatch = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
                if (createTableMatch) {
                    const tableName = createTableMatch[1];
                    if (tableExists(db, tableName)) {
                        console.log(`[SQLite] 表 ${tableName} 已存在，跳过`);
                        continue;
                    }
                }

                // 特殊处理 CREATE INDEX IF NOT EXISTS
                if (sql.includes('CREATE INDEX IF NOT EXISTS')) {
                    // CREATE INDEX IF NOT EXISTS 会自动处理，直接执行
                }

                db.run(sql);
                console.log(`[SQLite] ✓ 执行成功`);
            } catch (err) {
                const error = err as Error;
                // 如果是"列已存在"或"表已存在"错误，忽略
                if (error.message?.includes('duplicate column name') ||
                    error.message?.includes('already exists')) {
                    console.log(`[SQLite] ⚠ 跳过 (已存在): ${error.message}`);
                    continue;
                }
                console.error(`[SQLite] ✗ 迁移失败:`, error.message);
                throw error;
            }
        }

        setDbVersion(db, version);
        console.log(`[SQLite] ✓ 迁移到版本 ${version} 完成`);
    }

    console.log('[SQLite] ✓ 所有迁移完成');
}

async function initDatabase(customPath?: string): Promise<SqlJsDatabase> {
    if (dbInstance) return dbInstance;

    // 防止并发初始化
    if (initPromise) return initPromise;

    initPromise = (async () => {
        console.log('[SQLite] 正在初始化数据库...');

        // 确保数据目录存在
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log('[SQLite] 创建数据目录:', dataDir);
        }

        dbPath = customPath || path.join(dataDir, 'ai-travel.db');
        console.log('[SQLite] 数据库路径:', dbPath);

        // 初始化 sql.js
        const SQL = await initSqlJs();

        // 如果数据库文件存在，加载它
        if (fs.existsSync(dbPath)) {
            console.log('[SQLite] 加载现有数据库');
            const buffer = fs.readFileSync(dbPath);
            dbInstance = new SQL.Database(buffer);
        } else {
            console.log('[SQLite] 创建新数据库');
            dbInstance = new SQL.Database();
        }

        // 创建基础表结构
        createTables(dbInstance);

        // 运行数据库迁移
        runMigrations(dbInstance);

        // 保存数据库
        saveToFile();

        console.log('[SQLite] 数据库初始化完成 ✓');
        return dbInstance;
    })();

    return initPromise;
}

function createTables(db: SqlJsDatabase): void {
    // 设置表
    db.run(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    `);

    // 世界表（只存储基本信息，不包含子对象）
    db.run(`
        CREATE TABLE IF NOT EXISTS worlds (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            subtitle TEXT,
            description TEXT NOT NULL,
            detailed_description TEXT,
            cover_image TEXT,
            tags TEXT,
            geography TEXT,
            climate TEXT,
            culture TEXT,
            inhabitants TEXT,
            cuisine TEXT,
            language TEXT,
            currency TEXT,
            rules TEXT,
            best_time_to_visit TEXT,
            image_url TEXT,
            overview_images TEXT,
            culture_images TEXT,
            era TEXT,
            generation_status TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    `);

    // 旅行器表
    db.run(`
        CREATE TABLE IF NOT EXISTS vehicles (
            id TEXT PRIMARY KEY,
            world_id TEXT NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            description TEXT NOT NULL,
            detailed_description TEXT,
            image TEXT,
            capacity INTEGER,
            speed TEXT,
            abilities TEXT,
            comfort_level INTEGER,
            appearance TEXT,
            interior_description TEXT,
            generation_status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
        )
    `);

    // 旅游项目表
    db.run(`
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            world_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            cover_image TEXT,
            bgm_url TEXT,
            duration INTEGER,
            difficulty INTEGER,
            tags TEXT,
            suitable_for TEXT,
            tour_route TEXT,
            generation_status TEXT NOT NULL,
            selected_count INTEGER DEFAULT 0,
            available_at TEXT,
            telesummary TEXT,
            estimated_duration TEXT,
            created_at TEXT NOT NULL,
            details_generated_at TEXT,
            FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
        )
    `);

    // 景点表
    db.run(`
        CREATE TABLE IF NOT EXISTS spots (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            detailed_description TEXT,
            image TEXT,
            story TEXT,
            highlights TEXT,
            visit_tips TEXT,
            hotspots TEXT,
            entry_dialog_id TEXT,
            npc_ids TEXT,
            suggested_duration INTEGER,
            order_in_route INTEGER,
            generation_status TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
    `);

    // NPC 表
    db.run(`
        CREATE TABLE IF NOT EXISTS npcs (
            id TEXT PRIMARY KEY,
            world_id TEXT,
            spot_id TEXT,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            description TEXT NOT NULL,
            backstory TEXT,
            personality TEXT,
            appearance TEXT,
            speaking_style TEXT,
            interests TEXT,
            sprite TEXT,
            sprites TEXT,
            greeting_dialog_id TEXT,
            dialog_options TEXT,
            generation_status TEXT NOT NULL
        )
    `);

    // 旅游会话表
    db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            player_id TEXT NOT NULL,
            world_id TEXT NOT NULL,
            project_id TEXT NOT NULL,
            status TEXT NOT NULL,
            current_spot_id TEXT,
            visited_spots TEXT,
            progress REAL DEFAULT 0,
            departure_time TEXT,
            estimated_return_time TEXT,
            actual_return_time TEXT,
            memories TEXT,
            items TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    `);

    // AI 调用记录表
    db.run(`
        CREATE TABLE IF NOT EXISTS ai_calls (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            world_id TEXT,
            project_id TEXT,
            spot_id TEXT,
            npc_id TEXT,
            prompt TEXT NOT NULL,
            response TEXT,
            success INTEGER NOT NULL,
            error TEXT,
            model TEXT,
            prompt_tokens INTEGER,
            completion_tokens INTEGER,
            total_tokens INTEGER,
            duration INTEGER NOT NULL,
            retry_count INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        )
    `);

    // 对话脚本表
    db.run(`
        CREATE TABLE IF NOT EXISTS dialog_scripts (
            id TEXT PRIMARY KEY,
            npc_id TEXT NOT NULL,
            spot_id TEXT NOT NULL,
            type TEXT NOT NULL,
            lines TEXT NOT NULL,
            condition TEXT,
            order_num INTEGER DEFAULT 0,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (npc_id) REFERENCES npcs(id) ON DELETE CASCADE,
            FOREIGN KEY (spot_id) REFERENCES spots(id) ON DELETE CASCADE
        )
    `);

    // 对话脚本表
    db.run(`
        CREATE TABLE IF NOT EXISTS dialog_scripts (
            id TEXT PRIMARY KEY,
            npc_id TEXT NOT NULL,
            spot_id TEXT NOT NULL,
            type TEXT NOT NULL,
            lines TEXT NOT NULL,
            condition TEXT,
            order_num INTEGER DEFAULT 0,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (npc_id) REFERENCES npcs(id) ON DELETE CASCADE,
            FOREIGN KEY (spot_id) REFERENCES spots(id) ON DELETE CASCADE
        )
    `);

    // 用户表 (基础结构，不包含通过迁移添加的列)
    // 注意：currency_balance 和 last_daily_claim_date 通过迁移 v2 添加
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'free',
            avatar TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            last_login_at TEXT,
            today_world_generation_count INTEGER DEFAULT 0,
            stats_reset_date TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    `);

    // 货币交易记录表 (通过迁移 v2 创建，这里保留以支持新数据库)
    db.run(`
        CREATE TABLE IF NOT EXISTS currency_transactions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            amount INTEGER NOT NULL,
            balance_after INTEGER NOT NULL,
            type TEXT NOT NULL,
            description TEXT NOT NULL,
            reference_id TEXT,
            reference_type TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // 用户会话表
    db.run(`
        CREATE TABLE IF NOT EXISTS user_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            token TEXT NOT NULL UNIQUE,
            expires_at TEXT NOT NULL,
            user_agent TEXT,
            ip_address TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // 创建索引
    db.run(`CREATE INDEX IF NOT EXISTS idx_vehicles_world ON vehicles(world_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_projects_world ON projects(world_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_spots_project ON spots(project_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_npcs_spot ON npcs(spot_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_npcs_world ON npcs(world_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_player ON sessions(player_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_world ON sessions(world_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_ai_calls_type ON ai_calls(type)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_ai_calls_world ON ai_calls(world_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_ai_calls_created ON ai_calls(created_at)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_currency_transactions_user ON currency_transactions(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_currency_transactions_created ON currency_transactions(created_at)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_dialog_scripts_npc ON dialog_scripts(npc_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_dialog_scripts_spot ON dialog_scripts(spot_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_dialog_scripts_type ON dialog_scripts(type)`);
}

function saveToFile(): void {
    if (!dbInstance || !dbPath) return;

    try {
        const data = dbInstance.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    } catch (error) {
        console.error('[SQLite] 保存数据库失败:', error);
    }
}

// ============================================
// SQLite 存储提供者实现
// ============================================

export class SQLiteStorageProvider implements IStorageProvider {
    private version: number;
    private initialized: boolean = false;

    constructor(_dbPath?: string, config: StorageConfig = {}) {
        this.version = config.version || 2;
    }

    private async getDb(): Promise<SqlJsDatabase> {
        if (!this.initialized) {
            await initDatabase();
            this.initialized = true;
        }
        return dbInstance!;
    }

    // ============================================
    // 设置操作
    // ============================================

    async getSetting<T>(key: string): Promise<T | null> {
        const db = await this.getDb();
        const result = db.exec(`SELECT value FROM settings WHERE key = ?`, [key]);
        if (result.length === 0 || result[0].values.length === 0) return null;
        return JSON.parse(result[0].values[0][0] as string);
    }

    async setSetting<T>(key: string, value: T): Promise<void> {
        const db = await this.getDb();
        db.run(
            `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
            [key, JSON.stringify(value)]
        );
        saveToFile();
    }

    // ============================================
    // 世界数据操作
    // ============================================

    async getWorld(id: string): Promise<World | null> {
        const db = await this.getDb();
        const result = db.exec(`SELECT * FROM worlds WHERE id = ?`, [id]);
        if (result.length === 0 || result[0].values.length === 0) return null;

        const world = this.rowToWorld(result[0].columns, result[0].values[0]);

        // 加载关联的旅行器
        world.travelVehicle = await this.getVehicleByWorldId(id) || undefined;

        // 加载关联的项目
        world.travelProjects = await this.getProjectsByWorldId(id);

        // 加载关联的 NPC
        world.npcs = await this.getNPCsByWorldId(id);

        return world;
    }

    async getAllWorlds(): Promise<World[]> {
        const db = await this.getDb();
        const result = db.exec(`SELECT * FROM worlds ORDER BY created_at DESC`);
        if (result.length === 0) return [];

        const worlds: World[] = [];
        for (const row of result[0].values) {
            const world = this.rowToWorld(result[0].columns, row);
            world.travelVehicle = await this.getVehicleByWorldId(world.id) || undefined;
            world.travelProjects = await this.getProjectsByWorldId(world.id);
            world.npcs = await this.getNPCsByWorldId(world.id);
            worlds.push(world);
        }

        return worlds;
    }

    async saveWorld(world: World): Promise<void> {
        const db = await this.getDb();

        db.run(`
            INSERT OR REPLACE INTO worlds (
                id, name, subtitle, description, detailed_description, cover_image,
                tags, geography, climate, culture, inhabitants, cuisine,
                language, currency, rules, best_time_to_visit, image_url, overview_images,
                culture_images, era, generation_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            world.id,
            world.name,
            world.subtitle || null,
            world.description,
            world.detailedDescription || null,
            world.coverImage || null,
            JSON.stringify(world.tags),
            world.geography,
            world.climate,
            world.culture,
            world.inhabitants,
            world.cuisine,
            world.language,
            world.currency,
            world.rules || null,
            world.bestTimeToVisit || null,
            world.imageUrl || null,
            JSON.stringify(world.overviewImages || []),
            JSON.stringify(world.cultureImages || []),
            world.era || null,
            world.generationStatus,
            world.createdAt,
        ]);

        // 保存关联的旅行器
        if (world.travelVehicle) {
            await this.saveVehicle(world.travelVehicle, world.id);
        }

        // 保存关联的项目
        for (const project of world.travelProjects) {
            await this.saveProject({ ...project, worldId: world.id });
        }

        // 保存关联的 NPC
        if (world.npcs) {
            for (const npc of world.npcs) {
                await this.saveNPC({ ...npc, worldId: world.id }, world.id);
            }
        }

        saveToFile();
    }

    async deleteWorld(id: string): Promise<void> {
        const db = await this.getDb();
        // 由于外键级联删除，只需删除世界即可
        db.run(`DELETE FROM worlds WHERE id = ?`, [id]);
        saveToFile();
    }

    private rowToWorld(columns: string[], row: unknown[]): World {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => {
            obj[col] = row[i];
        });

        return {
            id: obj.id as string,
            name: obj.name as string,
            subtitle: obj.subtitle as string | undefined,
            description: obj.description as string,
            detailedDescription: obj.detailed_description as string,
            coverImage: obj.cover_image as string | undefined,
            tags: JSON.parse((obj.tags as string) || '[]'),
            geography: obj.geography as string,
            climate: obj.climate as string,
            culture: obj.culture as string,
            inhabitants: obj.inhabitants as string,
            cuisine: obj.cuisine as string,
            language: obj.language as string,
            currency: obj.currency as string,
            rules: obj.rules as string | undefined,
            bestTimeToVisit: obj.best_time_to_visit as string | undefined,
            imageUrl: obj.image_url as string | undefined,
            overviewImages: obj.overview_images ? JSON.parse(obj.overview_images as string) : [],
            cultureImages: obj.culture_images ? JSON.parse(obj.culture_images as string) : [],
            era: obj.era as string | undefined,
            generationStatus: obj.generation_status as World['generationStatus'],
            createdAt: obj.created_at as string,
            travelVehicle: undefined,
            travelProjects: [],
        };
    }

    // ============================================
    // 旅行器操作
    // ============================================

    async getVehicle(id: string): Promise<TravelVehicle | null> {
        const db = await this.getDb();
        const result = db.exec(`SELECT * FROM vehicles WHERE id = ?`, [id]);
        if (result.length === 0 || result[0].values.length === 0) return null;
        return this.rowToVehicle(result[0].columns, result[0].values[0]);
    }

    async getVehicleByWorldId(worldId: string): Promise<TravelVehicle | null> {
        const db = await this.getDb();
        const result = db.exec(`SELECT * FROM vehicles WHERE world_id = ?`, [worldId]);
        if (result.length === 0 || result[0].values.length === 0) return null;
        return this.rowToVehicle(result[0].columns, result[0].values[0]);
    }

    async saveVehicle(vehicle: TravelVehicle, worldId: string): Promise<void> {
        const db = await this.getDb();
        db.run(`
            INSERT OR REPLACE INTO vehicles (
                id, world_id, name, type, description, detailed_description, image,
                capacity, speed, abilities, comfort_level, appearance, interior_description,
                generation_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            vehicle.id,
            worldId,
            vehicle.name,
            vehicle.type,
            vehicle.description,
            vehicle.detailedDescription,
            vehicle.image || null,
            vehicle.capacity,
            vehicle.speed,
            JSON.stringify(vehicle.abilities),
            vehicle.comfortLevel,
            vehicle.appearance,
            vehicle.interiorDescription,
            vehicle.generationStatus,
            vehicle.createdAt,
        ]);
        saveToFile();
    }

    private rowToVehicle(columns: string[], row: unknown[]): TravelVehicle {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => {
            obj[col] = row[i];
        });

        return {
            id: obj.id as string,
            name: obj.name as string,
            type: obj.type as string,
            description: obj.description as string,
            detailedDescription: obj.detailed_description as string,
            image: obj.image as string | undefined,
            capacity: obj.capacity as number,
            speed: obj.speed as string,
            abilities: JSON.parse((obj.abilities as string) || '[]'),
            comfortLevel: obj.comfort_level as number,
            appearance: obj.appearance as string,
            interiorDescription: obj.interior_description as string,
            generationStatus: obj.generation_status as TravelVehicle['generationStatus'],
            createdAt: obj.created_at as string,
        };
    }

    // ============================================
    // 旅游项目操作
    // ============================================

    async getProject(id: string): Promise<TravelProject | null> {
        const db = await this.getDb();
        const result = db.exec(`SELECT * FROM projects WHERE id = ?`, [id]);
        if (result.length === 0 || result[0].values.length === 0) return null;

        const project = this.rowToProject(result[0].columns, result[0].values[0]);
        project.spots = await this.getSpotsByProjectId(id);
        return project;
    }

    async getProjectsByWorldId(worldId: string): Promise<TravelProject[]> {
        const db = await this.getDb();
        const result = db.exec(`SELECT * FROM projects WHERE world_id = ? ORDER BY created_at`, [worldId]);
        if (result.length === 0) return [];

        const projects: TravelProject[] = [];
        for (const row of result[0].values) {
            const project = this.rowToProject(result[0].columns, row);
            project.spots = await this.getSpotsByProjectId(project.id);
            projects.push(project);
        }

        return projects;
    }

    async saveProject(project: TravelProject): Promise<void> {
        const db = await this.getDb();
        db.run(`
            INSERT OR REPLACE INTO projects (
                id, world_id, name, description, cover_image, bgm_url, duration, difficulty,
                tags, suitable_for, tour_route, generation_status, selected_count,
                available_at, telesummary, estimated_duration, created_at, details_generated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            project.id,
            project.worldId,
            project.name,
            project.description,
            project.coverImage || null,
            project.bgmUrl || null,
            project.duration,
            project.difficulty,
            JSON.stringify(project.tags),
            project.suitableFor,
            JSON.stringify(project.tourRoute),
            project.generationStatus,
            project.selectedCount,
            project.availableAt || null,
            project.telesummary || null,
            project.estimatedDuration ? JSON.stringify(project.estimatedDuration) : null,
            project.createdAt,
            project.detailsGeneratedAt || null,
        ]);

        // 保存关联的景点
        for (const spot of project.spots) {
            await this.saveSpot({ ...spot, projectId: project.id });
        }

        saveToFile();
    }

    private rowToProject(columns: string[], row: unknown[]): TravelProject {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => {
            obj[col] = row[i];
        });

        return {
            id: obj.id as string,
            worldId: obj.world_id as string,
            name: obj.name as string,
            description: obj.description as string,
            coverImage: obj.cover_image as string | undefined,
            bgmUrl: obj.bgm_url as string | undefined,
            duration: obj.duration as number,
            difficulty: obj.difficulty as number,
            tags: JSON.parse((obj.tags as string) || '[]'),
            suitableFor: obj.suitable_for as string,
            tourRoute: JSON.parse((obj.tour_route as string) || '[]'),
            generationStatus: obj.generation_status as TravelProject['generationStatus'],
            selectedCount: obj.selected_count as number,
            availableAt: obj.available_at as string | undefined,
            telesummary: obj.telesummary as string | undefined,
            estimatedDuration: obj.estimated_duration ? JSON.parse(obj.estimated_duration as string) : undefined,
            createdAt: obj.created_at as string,
            detailsGeneratedAt: obj.details_generated_at as string | undefined,
            spots: [],
        };
    }

    // ============================================
    // 景点操作
    // ============================================

    async getSpot(id: string): Promise<Spot | null> {
        const db = await this.getDb();
        const result = db.exec(`SELECT * FROM spots WHERE id = ?`, [id]);
        if (result.length === 0 || result[0].values.length === 0) return null;

        const spot = this.rowToSpot(result[0].columns, result[0].values[0]);
        return spot;
    }

    async getSpotsByProjectId(projectId: string): Promise<Spot[]> {
        const db = await this.getDb();
        const result = db.exec(`SELECT * FROM spots WHERE project_id = ? ORDER BY order_in_route`, [projectId]);
        if (result.length === 0) return [];

        const spots: Spot[] = [];
        for (const row of result[0].values) {
            const spot = this.rowToSpot(result[0].columns, row);
            spots.push(spot);
        }

        return spots;
    }

    async saveSpot(spot: Spot): Promise<void> {
        const db = await this.getDb();
        db.run(`
            INSERT OR REPLACE INTO spots (
                id, project_id, name, description, detailed_description, image,
                story, highlights, visit_tips, hotspots, entry_dialog_id, npc_ids,
                suggested_duration, order_in_route, generation_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            spot.id,
            spot.projectId,
            spot.name,
            spot.description,
            spot.detailedDescription,
            spot.image || null,
            spot.story,
            JSON.stringify(spot.highlights),
            spot.visitTips || null,
            JSON.stringify(spot.hotspots),
            spot.entryDialogId || null,
            JSON.stringify(spot.npcIds || spot.npcs?.map(n => n.id) || []),
            spot.suggestedDuration,
            spot.orderInRoute,
            spot.generationStatus,
        ]);

        // 保存关联的 NPC
        if (spot.npcs && spot.npcs.length > 0) {
            for (const npc of spot.npcs) {
                if ('backstory' in npc && 'personality' in npc) {
                    await this.saveNPC(npc as SpotNPC, spot.id);
                }
            }
        }

        saveToFile();
    }

    private rowToSpot(columns: string[], row: unknown[]): Spot {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => {
            obj[col] = row[i];
        });

        return {
            id: obj.id as string,
            projectId: obj.project_id as string,
            name: obj.name as string,
            description: obj.description as string,
            detailedDescription: obj.detailed_description as string,
            image: obj.image as string | undefined,
            story: obj.story as string,
            highlights: JSON.parse((obj.highlights as string) || '[]'),
            visitTips: obj.visit_tips as string | undefined,
            hotspots: JSON.parse((obj.hotspots as string) || '[]'),
            entryDialogId: obj.entry_dialog_id as string | undefined,
            npcIds: obj.npc_ids ? JSON.parse(obj.npc_ids as string) : [],
            suggestedDuration: obj.suggested_duration as number,
            orderInRoute: obj.order_in_route as number,
            generationStatus: obj.generation_status as Spot['generationStatus'],
            npcs: undefined,
        };
    }

    // ============================================
    // NPC 操作
    // ============================================

    async getNPC(id: string): Promise<SpotNPC | null> {
        const db = await this.getDb();
        const result = db.exec(`SELECT * FROM npcs WHERE id = ?`, [id]);
        if (result.length === 0 || result[0].values.length === 0) return null;
        return this.rowToNPC(result[0].columns, result[0].values[0]);
    }

    async getNPCsBySpotId(spotId: string): Promise<SpotNPC[]> {
        const db = await this.getDb();
        const result = db.exec(`SELECT * FROM npcs WHERE spot_id = ?`, [spotId]);
        if (result.length === 0) return [];
        return result[0].values.map(row => this.rowToNPC(result[0].columns, row));
    }

    async getNPCsByWorldId(worldId: string): Promise<SpotNPC[]> {
        const db = await this.getDb();
        const result = db.exec(`SELECT * FROM npcs WHERE world_id = ? ORDER BY name`, [worldId]);
        if (result.length === 0) return [];
        return result[0].values.map(row => this.rowToNPC(result[0].columns, row));
    }

    async getNPCsByIds(ids: string[]): Promise<SpotNPC[]> {
        if (ids.length === 0) return [];

        const db = await this.getDb();
        const placeholders = ids.map(() => '?').join(',');
        const result = db.exec(`SELECT * FROM npcs WHERE id IN (${placeholders})`, ids);
        if (result.length === 0) return [];

        const rows = result[0].values.map(row => this.rowToNPC(result[0].columns, row));

        // 按传入顺序排序，方便前端与引用顺序一致
        const orderMap = new Map<string, number>();
        ids.forEach((id, index) => orderMap.set(id, index));

        return rows.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
    }

    async getAllNPCs(params?: { limit?: number; offset?: number; worldId?: string }): Promise<{ npcs: SpotNPC[]; total: number }> {
        const db = await this.getDb();
        const limit = params?.limit ?? 200;
        const offset = params?.offset ?? 0;

        let query = `SELECT * FROM npcs`;
        let countQuery = `SELECT COUNT(*) as count FROM npcs`;
        const queryParams: (string | number)[] = [];
        const countParams: string[] = [];

        if (params?.worldId) {
            query += ` WHERE world_id = ?`;
            countQuery += ` WHERE world_id = ?`;
            queryParams.push(params.worldId);
            countParams.push(params.worldId);
        }

        query += ` ORDER BY name LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);

        const listResult = db.exec(query, queryParams);
        const npcs = listResult.length === 0
            ? []
            : listResult[0].values.map(row => this.rowToNPC(listResult[0].columns, row));

        let total = npcs.length;
        try {
            const countResult = db.exec(countQuery, countParams);
            if (countResult.length > 0 && countResult[0].values.length > 0) {
                total = Number(countResult[0].values[0][0]) || total;
            }
        } catch {
            // ignore count error, fallback to current page size
        }

        return { npcs, total };
    }

    async saveNPC(npc: SpotNPC, worldId: string): Promise<void> {
        const db = await this.getDb();
        const resolvedWorldId = worldId || npc.worldId;

        if (!resolvedWorldId) {
            throw new Error('saveNPC: worldId is required');
        }

        db.run(`
            INSERT OR REPLACE INTO npcs (
                id, world_id, spot_id, name, role, description, backstory, personality,
                appearance, speaking_style, interests, sprite, sprites,
                greeting_dialog_id, dialog_options, generation_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            npc.id,
            resolvedWorldId,
            npc.spotId || null,
            npc.name,
            npc.role,
            npc.description,
            npc.backstory,
            JSON.stringify(npc.personality),
            npc.appearance,
            npc.speakingStyle,
            npc.interests ? JSON.stringify(npc.interests) : null,
            npc.sprite || null,
            npc.sprites ? JSON.stringify(npc.sprites) : null,
            npc.greetingDialogId || null,
            npc.dialogOptions ? JSON.stringify(npc.dialogOptions) : null,
            npc.generationStatus,
        ]);
        saveToFile();
    }

    async deleteNPC(id: string): Promise<void> {
        const db = await this.getDb();
        db.run(`DELETE FROM npcs WHERE id = ?`, [id]);
        saveToFile();
    }

    private rowToNPC(columns: string[], row: unknown[]): SpotNPC {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => {
            obj[col] = row[i];
        });

        return {
            id: obj.id as string,
            worldId: obj.world_id as string,
            name: obj.name as string,
            role: obj.role as string,
            description: obj.description as string,
            backstory: obj.backstory as string,
            personality: JSON.parse((obj.personality as string) || '[]'),
            appearance: obj.appearance as string,
            speakingStyle: obj.speaking_style as string,
            interests: obj.interests ? JSON.parse(obj.interests as string) : undefined,
            sprite: obj.sprite as string | undefined,
            sprites: obj.sprites ? JSON.parse(obj.sprites as string) : undefined,
            greetingDialogId: obj.greeting_dialog_id as string | undefined,
            dialogOptions: obj.dialog_options ? JSON.parse(obj.dialog_options as string) : undefined,
            spotId: obj.spot_id as string | undefined,
            generationStatus: obj.generation_status as SpotNPC['generationStatus'],
        };
    }

    // ============================================
    // 旅游会话操作
    // ============================================

    async getSession(id: string): Promise<TravelSession | null> {
        const db = await this.getDb();
        const result = db.exec(`SELECT * FROM sessions WHERE id = ?`, [id]);
        if (result.length === 0 || result[0].values.length === 0) return null;
        return this.rowToSession(result[0].columns, result[0].values[0]);
    }

    async getPlayerSessions(playerId: string): Promise<TravelSession[]> {
        const db = await this.getDb();
        const result = db.exec(
            `SELECT * FROM sessions WHERE player_id = ? ORDER BY created_at DESC`,
            [playerId]
        );
        if (result.length === 0) return [];
        return result[0].values.map(row => this.rowToSession(result[0].columns, row));
    }

    async saveSession(session: TravelSession): Promise<void> {
        const db = await this.getDb();
        db.run(`
            INSERT OR REPLACE INTO sessions (
                id, player_id, world_id, project_id, status, current_spot_id,
                visited_spots, progress, departure_time, estimated_return_time,
                actual_return_time, memories, items, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            session.id,
            session.playerId,
            session.worldId,
            session.projectId,
            session.status,
            session.currentSpotId || null,
            JSON.stringify(session.visitedSpots),
            session.progress,
            session.departureTime,
            session.estimatedReturnTime,
            session.actualReturnTime || null,
            JSON.stringify(session.memories),
            JSON.stringify(session.items),
            session.createdAt,
            session.updatedAt,
        ]);
        saveToFile();
    }

    async getLatestPlayerSession(playerId: string): Promise<TravelSession | null> {
        const sessions = await this.getPlayerSessions(playerId);
        return sessions[0] || null;
    }

    private rowToSession(columns: string[], row: unknown[]): TravelSession {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => {
            obj[col] = row[i];
        });

        return {
            id: obj.id as string,
            playerId: obj.player_id as string,
            worldId: obj.world_id as string,
            projectId: obj.project_id as string,
            status: obj.status as TravelSession['status'],
            currentSpotId: obj.current_spot_id as string | undefined,
            visitedSpots: JSON.parse((obj.visited_spots as string) || '[]'),
            progress: obj.progress as number,
            departureTime: obj.departure_time as string,
            estimatedReturnTime: obj.estimated_return_time as string,
            actualReturnTime: obj.actual_return_time as string | undefined,
            memories: JSON.parse((obj.memories as string) || '[]'),
            items: JSON.parse((obj.items as string) || '[]'),
            createdAt: obj.created_at as string,
            updatedAt: obj.updated_at as string,
        };
    }

    // ============================================
    // AI 调用记录操作
    // ============================================

    async saveAICall(record: AICallRecord): Promise<void> {
        const db = await this.getDb();
        db.run(`
            INSERT INTO ai_calls (
                id, type, world_id, project_id, spot_id, npc_id,
                prompt, response, success, error, model,
                prompt_tokens, completion_tokens, total_tokens,
                duration, retry_count, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            record.id,
            record.type,
            record.worldId || null,
            record.projectId || null,
            record.spotId || null,
            record.npcId || null,
            record.prompt,
            record.response || null,
            record.success ? 1 : 0,
            record.error || null,
            record.model || null,
            record.tokenUsage?.promptTokens || null,
            record.tokenUsage?.completionTokens || null,
            record.tokenUsage?.totalTokens || null,
            record.duration,
            record.retryCount,
            record.createdAt,
        ]);
        saveToFile();
    }

    async getAICall(id: string): Promise<AICallRecord | null> {
        const db = await this.getDb();
        const result = db.exec(`SELECT * FROM ai_calls WHERE id = ?`, [id]);
        if (result.length === 0 || result[0].values.length === 0) return null;
        return this.rowToAICall(result[0].columns, result[0].values[0]);
    }

    async getAICalls(params: AICallQueryParams = {}): Promise<AICallRecord[]> {
        const db = await this.getDb();
        const conditions: string[] = [];
        const values: (string | number | null)[] = [];

        if (params.type) {
            conditions.push('type = ?');
            values.push(params.type);
        }
        if (params.worldId) {
            conditions.push('world_id = ?');
            values.push(params.worldId);
        }
        if (params.projectId) {
            conditions.push('project_id = ?');
            values.push(params.projectId);
        }
        if (params.success !== undefined) {
            conditions.push('success = ?');
            values.push(params.success ? 1 : 0);
        }
        if (params.startDate) {
            conditions.push('created_at >= ?');
            values.push(params.startDate);
        }
        if (params.endDate) {
            conditions.push('created_at <= ?');
            values.push(params.endDate);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const limit = params.limit || 100;
        const offset = params.offset || 0;

        const result = db.exec(
            `SELECT * FROM ai_calls ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...values, limit, offset] as (string | number | null | Uint8Array)[]
        );

        if (result.length === 0) return [];
        return result[0].values.map(row => this.rowToAICall(result[0].columns, row));
    }

    async getAICallStats(params: AICallQueryParams = {}): Promise<AICallStats> {
        const db = await this.getDb();
        const conditions: string[] = [];
        const values: (string | number | null)[] = [];

        if (params.worldId) {
            conditions.push('world_id = ?');
            values.push(params.worldId);
        }
        if (params.startDate) {
            conditions.push('created_at >= ?');
            values.push(params.startDate);
        }
        if (params.endDate) {
            conditions.push('created_at <= ?');
            values.push(params.endDate);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // 总体统计
        const totalResult = db.exec(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_count,
                SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_count,
                COALESCE(SUM(total_tokens), 0) as total_tokens,
                COALESCE(SUM(duration), 0) as total_duration,
                COALESCE(AVG(duration), 0) as avg_duration
            FROM ai_calls ${whereClause}
        `, values as (string | number | null | Uint8Array)[]);

        const totalRow = totalResult[0]?.values[0] || [0, 0, 0, 0, 0, 0];

        // 按类型统计
        const typeResult = db.exec(`
            SELECT
                type,
                COUNT(*) as count,
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_count,
                SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_count,
                COALESCE(AVG(duration), 0) as avg_duration
            FROM ai_calls ${whereClause}
            GROUP BY type
        `, values as (string | number | null | Uint8Array)[]);

        const byType: AICallStats['byType'] = {} as AICallStats['byType'];
        if (typeResult.length > 0) {
            for (const row of typeResult[0].values) {
                byType[row[0] as AICallType] = {
                    count: row[1] as number,
                    success: row[2] as number,
                    failed: row[3] as number,
                    avgDuration: row[4] as number,
                };
            }
        }

        return {
            totalCalls: totalRow[0] as number,
            successCalls: totalRow[1] as number,
            failedCalls: totalRow[2] as number,
            totalTokens: totalRow[3] as number,
            totalDuration: totalRow[4] as number,
            avgDuration: totalRow[5] as number,
            byType,
        };
    }

    private rowToAICall(columns: string[], row: unknown[]): AICallRecord {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => {
            obj[col] = row[i];
        });

        return {
            id: obj.id as string,
            type: obj.type as AICallType,
            worldId: obj.world_id as string | undefined,
            projectId: obj.project_id as string | undefined,
            spotId: obj.spot_id as string | undefined,
            npcId: obj.npc_id as string | undefined,
            prompt: obj.prompt as string,
            response: obj.response as string | undefined,
            success: obj.success === 1,
            error: obj.error as string | undefined,
            model: obj.model as string | undefined,
            tokenUsage: obj.total_tokens ? {
                promptTokens: obj.prompt_tokens as number,
                completionTokens: obj.completion_tokens as number,
                totalTokens: obj.total_tokens as number,
            } : undefined,
            duration: obj.duration as number,
            retryCount: obj.retry_count as number,
            createdAt: obj.created_at as string,
        };
    }

    // ============================================
    // 对话脚本操作
    // ============================================

    async getDialogScript(id: string): Promise<DialogScript | null> {
        const db = await this.getDb();
        const result = db.exec(`SELECT * FROM dialog_scripts WHERE id = ?`, [id]);
        if (result.length === 0 || result[0].values.length === 0) return null;
        return this.rowToDialogScript(result[0].columns, result[0].values[0]);
    }

    async getDialogScripts(params: {
        npcId?: string;
        spotId?: string;
        type?: DialogScriptType;
        isActive?: boolean;
        limit?: number;
    } = {}): Promise<DialogScript[]> {
        const db = await this.getDb();
        const conditions: string[] = [];
        const values: (string | number | null)[] = [];

        if (params.npcId) {
            conditions.push('npc_id = ?');
            values.push(params.npcId);
        }
        if (params.spotId) {
            conditions.push('spot_id = ?');
            values.push(params.spotId);
        }
        if (params.type) {
            conditions.push('type = ?');
            values.push(params.type);
        }
        if (params.isActive !== undefined) {
            conditions.push('is_active = ?');
            values.push(params.isActive ? 1 : 0);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const limit = params.limit || 100;

        const result = db.exec(
            `SELECT * FROM dialog_scripts ${whereClause} ORDER BY order_num ASC, created_at ASC LIMIT ?`,
            [...values, limit] as (string | number | null | Uint8Array)[]
        );

        if (result.length === 0) return [];
        return result[0].values.map(row => this.rowToDialogScript(result[0].columns, row));
    }

    async saveDialogScript(script: DialogScript): Promise<void> {
        const db = await this.getDb();
        db.run(`
            INSERT OR REPLACE INTO dialog_scripts (
                id, npc_id, spot_id, type, lines, condition, order_num,
                is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            script.id,
            script.npcId,
            script.spotId,
            script.type,
            JSON.stringify(script.lines),
            script.condition || null,
            script.order,
            script.isActive ? 1 : 0,
            script.createdAt,
            script.updatedAt,
        ]);
        saveToFile();
    }

    async deleteDialogScript(id: string): Promise<void> {
        const db = await this.getDb();
        db.run(`DELETE FROM dialog_scripts WHERE id = ?`, [id]);
        saveToFile();
    }

    private rowToDialogScript(columns: string[], row: unknown[]): DialogScript {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => {
            obj[col] = row[i];
        });

        return {
            id: obj.id as string,
            npcId: obj.npc_id as string,
            spotId: obj.spot_id as string,
            type: obj.type as DialogScriptType,
            lines: JSON.parse(obj.lines as string),
            condition: obj.condition as string | undefined,
            order: (obj.order_num as number) ?? 0,
            isActive: (obj.is_active as number) === 1,
            createdAt: obj.created_at as string,
            updatedAt: obj.updated_at as string,
        };
    }

    // ============================================
    // 用户操作
    // ============================================

    async getUser(id: string): Promise<User | null> {
        const db = await this.getDb();
        const result = db.exec(`SELECT * FROM users WHERE id = ?`, [id]);
        if (result.length === 0 || result[0].values.length === 0) return null;
        return this.rowToUser(result[0].columns, result[0].values[0]);
    }

    async getUserByUsername(username: string): Promise<User | null> {
        const db = await this.getDb();
        const result = db.exec(`SELECT * FROM users WHERE username = ?`, [username]);
        if (result.length === 0 || result[0].values.length === 0) return null;
        return this.rowToUser(result[0].columns, result[0].values[0]);
    }

    async getUserByEmail(email: string): Promise<User | null> {
        const db = await this.getDb();
        const result = db.exec(`SELECT * FROM users WHERE email = ?`, [email]);
        if (result.length === 0 || result[0].values.length === 0) return null;
        return this.rowToUser(result[0].columns, result[0].values[0]);
    }

    async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | null> {
        const db = await this.getDb();
        const result = db.exec(
            `SELECT * FROM users WHERE username = ? OR email = ?`,
            [usernameOrEmail, usernameOrEmail]
        );
        if (result.length === 0 || result[0].values.length === 0) return null;
        return this.rowToUser(result[0].columns, result[0].values[0]);
    }

    async getAllUsers(params: UserListParams = {}): Promise<{ users: PublicUser[]; total: number }> {
        const db = await this.getDb();
        const conditions: string[] = [];
        const values: (string | number | null)[] = [];

        if (params.search) {
            conditions.push(`(username LIKE ? OR display_name LIKE ? OR email LIKE ?)`);
            const searchPattern = `%${params.search}%`;
            values.push(searchPattern, searchPattern, searchPattern);
        }
        if (params.role) {
            conditions.push(`role = ?`);
            values.push(params.role);
        }
        if (params.isActive !== undefined) {
            conditions.push(`is_active = ?`);
            values.push(params.isActive ? 1 : 0);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // 获取总数
        const countResult = db.exec(
            `SELECT COUNT(*) FROM users ${whereClause}`,
            values as (string | number | null | Uint8Array)[]
        );
        const total = countResult[0]?.values[0]?.[0] as number || 0;

        // 获取分页数据
        const page = params.page || 1;
        const pageSize = params.pageSize || 20;
        const offset = (page - 1) * pageSize;

        const result = db.exec(
            `SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...values, pageSize, offset] as (string | number | null | Uint8Array)[]
        );

        if (result.length === 0) {
            return { users: [], total };
        }

        const users = result[0].values.map(row => {
            const user = this.rowToUser(result[0].columns, row);
            // 移除密码哈希
            const { passwordHash: _, ...publicUser } = user;
            return publicUser as PublicUser;
        });

        return { users, total };
    }

    async saveUser(user: User): Promise<void> {
        const db = await this.getDb();
        db.run(`
            INSERT OR REPLACE INTO users (
                id, username, display_name, email, password_hash, role, avatar,
                is_active, last_login_at, today_world_generation_count, stats_reset_date,
                currency_balance, last_daily_claim_date, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            user.id,
            user.username,
            user.displayName,
            user.email,
            user.passwordHash || '',
            user.role,
            user.avatar || null,
            user.isActive ? 1 : 0,
            user.lastLoginAt || null,
            user.todayWorldGenerationCount,
            user.statsResetDate,
            user.currencyBalance || 0,
            user.lastDailyClaimDate || null,
            user.createdAt,
            user.updatedAt,
        ]);
        saveToFile();
    }

    async deleteUser(id: string): Promise<void> {
        const db = await this.getDb();
        db.run(`DELETE FROM users WHERE id = ?`, [id]);
        saveToFile();
    }

    async updateUserStats(userId: string, worldGenCount: number, resetDate: string): Promise<void> {
        const db = await this.getDb();
        db.run(
            `UPDATE users SET today_world_generation_count = ?, stats_reset_date = ?, updated_at = ? WHERE id = ?`,
            [worldGenCount, resetDate, new Date().toISOString(), userId]
        );
        saveToFile();
    }

    // ============================================
    // 货币操作
    // ============================================

    /**
     * 获取今天的日期字符串 (YYYY-MM-DD)
     */
    private getTodayDateString(): string {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    /**
     * 生成交易记录 ID
     */
    private generateTransactionId(): string {
        return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }

    /**
     * 领取每日登录奖励
     */
    async claimDailyBonus(userId: string): Promise<DailyClaimResult> {
        const user = await this.getUser(userId);
        if (!user) {
            return { claimed: false, amount: 0, newBalance: 0 };
        }

        const today = this.getTodayDateString();

        // 检查今天是否已经领取过
        if (user.lastDailyClaimDate === today) {
            return { claimed: false, amount: 0, newBalance: user.currencyBalance };
        }

        // 发放每日奖励
        const result = await this.updateCurrencyBalance(
            userId,
            DAILY_CLAIM_AMOUNT,
            'daily_claim',
            `每日登录奖励 (${today})`
        );

        // 更新最后领取日期
        const db = await this.getDb();
        db.run(
            `UPDATE users SET last_daily_claim_date = ?, updated_at = ? WHERE id = ?`,
            [today, new Date().toISOString(), userId]
        );
        saveToFile();

        return {
            claimed: true,
            amount: DAILY_CLAIM_AMOUNT,
            newBalance: result.newBalance,
        };
    }

    /**
     * 更新用户货币余额 (同时创建交易记录)
     */
    async updateCurrencyBalance(
        userId: string,
        amount: number,
        type: CurrencyTransactionType,
        description: string,
        referenceId?: string,
        referenceType?: 'world' | 'session' | 'item'
    ): Promise<{ newBalance: number; transaction: CurrencyTransaction }> {
        const db = await this.getDb();
        const user = await this.getUser(userId);

        if (!user) {
            throw new Error('用户不存在');
        }

        const newBalance = user.currencyBalance + amount;

        // 防止余额变为负数
        if (newBalance < 0) {
            throw new Error('余额不足');
        }

        // 创建交易记录
        const transaction: CurrencyTransaction = {
            id: this.generateTransactionId(),
            userId,
            amount,
            balanceAfter: newBalance,
            type,
            description,
            referenceId,
            referenceType,
            createdAt: new Date().toISOString(),
        };

        // 更新用户余额
        db.run(
            `UPDATE users SET currency_balance = ?, updated_at = ? WHERE id = ?`,
            [newBalance, new Date().toISOString(), userId]
        );

        // 插入交易记录
        db.run(`
            INSERT INTO currency_transactions (
                id, user_id, amount, balance_after, type, description,
                reference_id, reference_type, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            transaction.id,
            transaction.userId,
            transaction.amount,
            transaction.balanceAfter,
            transaction.type,
            transaction.description,
            transaction.referenceId || null,
            transaction.referenceType || null,
            transaction.createdAt,
        ]);

        saveToFile();

        return { newBalance, transaction };
    }

    /**
     * 获取用户交易记录
     */
    async getCurrencyTransactions(
        userId: string,
        limit: number = 20,
        offset: number = 0
    ): Promise<{ transactions: CurrencyTransaction[]; total: number }> {
        const db = await this.getDb();

        // 获取总数
        const countResult = db.exec(
            `SELECT COUNT(*) FROM currency_transactions WHERE user_id = ?`,
            [userId]
        );
        const total = countResult[0]?.values[0]?.[0] as number || 0;

        // 获取交易记录
        const result = db.exec(
            `SELECT * FROM currency_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        if (result.length === 0) {
            return { transactions: [], total };
        }

        const transactions = result[0].values.map(row =>
            this.rowToTransaction(result[0].columns, row)
        );

        return { transactions, total };
    }

    private rowToTransaction(columns: string[], row: unknown[]): CurrencyTransaction {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => {
            obj[col] = row[i];
        });

        return {
            id: obj.id as string,
            userId: obj.user_id as string,
            amount: obj.amount as number,
            balanceAfter: obj.balance_after as number,
            type: obj.type as CurrencyTransactionType,
            description: obj.description as string,
            referenceId: obj.reference_id as string | undefined,
            referenceType: obj.reference_type as 'world' | 'session' | 'item' | undefined,
            createdAt: obj.created_at as string,
        };
    }

    private rowToUser(columns: string[], row: unknown[]): User {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => {
            obj[col] = row[i];
        });

        return {
            id: obj.id as string,
            username: obj.username as string,
            displayName: obj.display_name as string,
            email: obj.email as string,
            passwordHash: obj.password_hash as string,
            role: obj.role as User['role'],
            avatar: obj.avatar as string | undefined,
            isActive: obj.is_active === 1,
            lastLoginAt: obj.last_login_at as string | undefined,
            todayWorldGenerationCount: obj.today_world_generation_count as number,
            statsResetDate: obj.stats_reset_date as string,
            currencyBalance: (obj.currency_balance as number) || 0,
            lastDailyClaimDate: obj.last_daily_claim_date as string | undefined,
            createdAt: obj.created_at as string,
            updatedAt: obj.updated_at as string,
        };
    }

    // ============================================
    // 用户会话操作
    // ============================================

    async getUserSession(id: string): Promise<UserSession | null> {
        const db = await this.getDb();
        const result = db.exec(`SELECT * FROM user_sessions WHERE id = ?`, [id]);
        if (result.length === 0 || result[0].values.length === 0) return null;
        return this.rowToUserSession(result[0].columns, result[0].values[0]);
    }

    async getUserSessionByToken(token: string): Promise<UserSession | null> {
        const db = await this.getDb();
        const result = db.exec(`SELECT * FROM user_sessions WHERE token = ?`, [token]);
        if (result.length === 0 || result[0].values.length === 0) return null;
        return this.rowToUserSession(result[0].columns, result[0].values[0]);
    }

    async saveUserSession(session: UserSession): Promise<void> {
        const db = await this.getDb();
        db.run(`
            INSERT OR REPLACE INTO user_sessions (
                id, user_id, token, expires_at, user_agent, ip_address, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            session.id,
            session.userId,
            session.token,
            session.expiresAt,
            session.userAgent || null,
            session.ipAddress || null,
            session.createdAt,
        ]);
        saveToFile();
    }

    async deleteUserSession(id: string): Promise<void> {
        const db = await this.getDb();
        db.run(`DELETE FROM user_sessions WHERE id = ?`, [id]);
        saveToFile();
    }

    async deleteUserSessionsByUserId(userId: string): Promise<void> {
        const db = await this.getDb();
        db.run(`DELETE FROM user_sessions WHERE user_id = ?`, [userId]);
        saveToFile();
    }

    async cleanExpiredSessions(): Promise<void> {
        const db = await this.getDb();
        const now = new Date().toISOString();
        db.run(`DELETE FROM user_sessions WHERE expires_at < ?`, [now]);
        saveToFile();
    }

    private rowToUserSession(columns: string[], row: unknown[]): UserSession {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => {
            obj[col] = row[i];
        });

        return {
            id: obj.id as string,
            userId: obj.user_id as string,
            token: obj.token as string,
            expiresAt: obj.expires_at as string,
            userAgent: obj.user_agent as string | undefined,
            ipAddress: obj.ip_address as string | undefined,
            createdAt: obj.created_at as string,
        };
    }

    // ============================================
    // 工具方法
    // ============================================

    async clear(): Promise<void> {
        const db = await this.getDb();
        db.run(`DELETE FROM settings`);
        db.run(`DELETE FROM ai_calls`);
        db.run(`DELETE FROM npcs`);
        db.run(`DELETE FROM spots`);
        db.run(`DELETE FROM projects`);
        db.run(`DELETE FROM vehicles`);
        db.run(`DELETE FROM sessions`);
        db.run(`DELETE FROM worlds`);
        db.run(`DELETE FROM currency_transactions`);
        db.run(`DELETE FROM user_sessions`);
        db.run(`DELETE FROM users`);
        db.run(`DELETE FROM dialog_scripts`);
        saveToFile();
    }

    async export(): Promise<string> {
        const worlds = await this.getAllWorlds();
        const db = await this.getDb();

        // 获取所有设置
        const settingsResult = db.exec(`SELECT key, value FROM settings`);
        const settings: Record<string, unknown> = {};
        if (settingsResult.length > 0) {
            for (const row of settingsResult[0].values) {
                settings[row[0] as string] = JSON.parse(row[1] as string);
            }
        }

        // 获取所有 AI 调用记录
        const aiCalls = await this.getAICalls({ limit: 10000 });

        // 获取所有对话脚本
        const dialogScripts = await this.getDialogScripts({ limit: 10000 });

        const exportData: ExportData = {
            version: this.version,
            exportedAt: new Date().toISOString(),
            settings,
            worlds,
            aiCalls,
            dialogScripts,
        };

        return JSON.stringify(exportData, null, 2);
    }

    async import(data: string): Promise<void> {
        const parsed = JSON.parse(data) as ExportData;

        // 导入设置
        for (const [key, value] of Object.entries(parsed.settings)) {
            await this.setSetting(key, value);
        }

        // 导入世界（包含关联数据）
        if (parsed.worlds) {
            for (const world of parsed.worlds) {
                await this.saveWorld(world);
            }
        }

        // 导入 AI 调用记录
        if (parsed.aiCalls) {
            for (const call of parsed.aiCalls) {
                await this.saveAICall(call);
            }
        }

        // 导入对话脚本
        if (parsed.dialogScripts) {
            for (const script of parsed.dialogScripts) {
                await this.saveDialogScript(script);
            }
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            await this.getDb();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 关闭数据库连接
     */
    close(): void {
        if (dbInstance) {
            dbInstance.close();
            dbInstance = null;
        }
    }
}

// ============================================
// 单例存储实例
// ============================================

let storageInstance: SQLiteStorageProvider | null = null;

export function getStorage(dbPath?: string): SQLiteStorageProvider {
    if (!storageInstance) {
        storageInstance = new SQLiteStorageProvider(dbPath);
    }
    return storageInstance;
}

export function closeStorage(): void {
    if (storageInstance) {
        storageInstance.close();
        storageInstance = null;
    }
}
