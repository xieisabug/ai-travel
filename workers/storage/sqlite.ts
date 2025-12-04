/**
 * SQLite 存储提供者
 *
 * 使用 sql.js (纯 JavaScript SQLite) 作为本地存储后端
 * 优化的分表存储结构
 */

import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import type { World, TravelProject, TravelVehicle, Spot, SpotNPC, TravelSession } from '~/types/world';
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

        // 创建表
        createTables(dbInstance);

        // 保存初始数据库
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
            spot_id TEXT NOT NULL,
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
            generation_status TEXT NOT NULL,
            FOREIGN KEY (spot_id) REFERENCES spots(id) ON DELETE CASCADE
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

    // 创建索引
    db.run(`CREATE INDEX IF NOT EXISTS idx_vehicles_world ON vehicles(world_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_projects_world ON projects(world_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_spots_project ON spots(project_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_npcs_spot ON npcs(spot_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_player ON sessions(player_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_world ON sessions(world_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_ai_calls_type ON ai_calls(type)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_ai_calls_world ON ai_calls(world_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_ai_calls_created ON ai_calls(created_at)`);
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
                language, currency, rules, best_time_to_visit, image_url, era,
                generation_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                id, world_id, name, description, cover_image, duration, difficulty,
                tags, suitable_for, tour_route, generation_status, selected_count,
                available_at, telesummary, estimated_duration, created_at, details_generated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            project.id,
            project.worldId,
            project.name,
            project.description,
            project.coverImage || null,
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
        spot.npcs = await this.getNPCsBySpotId(id);
        return spot;
    }

    async getSpotsByProjectId(projectId: string): Promise<Spot[]> {
        const db = await this.getDb();
        const result = db.exec(`SELECT * FROM spots WHERE project_id = ? ORDER BY order_in_route`, [projectId]);
        if (result.length === 0) return [];

        const spots: Spot[] = [];
        for (const row of result[0].values) {
            const spot = this.rowToSpot(result[0].columns, row);
            spot.npcs = await this.getNPCsBySpotId(spot.id);
            spots.push(spot);
        }

        return spots;
    }

    async saveSpot(spot: Spot): Promise<void> {
        const db = await this.getDb();
        db.run(`
            INSERT OR REPLACE INTO spots (
                id, project_id, name, description, detailed_description, image,
                story, highlights, visit_tips, hotspots, entry_dialog_id,
                suggested_duration, order_in_route, generation_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            spot.suggestedDuration,
            spot.orderInRoute,
            spot.generationStatus,
        ]);

        // 保存关联的 NPC
        for (const npc of spot.npcs) {
            await this.saveNPC(npc, spot.id);
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
            suggestedDuration: obj.suggested_duration as number,
            orderInRoute: obj.order_in_route as number,
            generationStatus: obj.generation_status as Spot['generationStatus'],
            npcs: [],
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

    async saveNPC(npc: SpotNPC, spotId: string): Promise<void> {
        const db = await this.getDb();
        db.run(`
            INSERT OR REPLACE INTO npcs (
                id, spot_id, name, role, description, backstory, personality,
                appearance, speaking_style, interests, sprite, sprites,
                greeting_dialog_id, dialog_options, generation_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            npc.id,
            spotId,
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

    private rowToNPC(columns: string[], row: unknown[]): SpotNPC {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => {
            obj[col] = row[i];
        });

        return {
            id: obj.id as string,
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

        const exportData: ExportData = {
            version: this.version,
            exportedAt: new Date().toISOString(),
            settings,
            worlds,
            aiCalls,
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
