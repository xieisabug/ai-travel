/**
 * SQLite 存储提供者
 * 
 * 使用 sql.js (纯 JavaScript SQLite) 作为本地存储后端
 * 适用于 Node.js 环境，无需原生编译
 */

import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import type { World, TravelSession } from '~/types/world';
import type { IStorageProvider, StorageConfig, ExportData } from './types';

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
        dbInstance.run(`
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        `);

        dbInstance.run(`
            CREATE TABLE IF NOT EXISTS worlds (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        `);

        dbInstance.run(`
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                player_id TEXT NOT NULL,
                world_id TEXT NOT NULL,
                project_id TEXT NOT NULL,
                data TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);

        // 创建索引
        dbInstance.run(`CREATE INDEX IF NOT EXISTS idx_sessions_player ON sessions(player_id)`);
        dbInstance.run(`CREATE INDEX IF NOT EXISTS idx_sessions_world ON sessions(world_id)`);

        // 保存初始数据库
        saveToFile();

        console.log('[SQLite] 数据库初始化完成 ✓');
        return dbInstance;
    })();

    return initPromise;
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
        this.version = config.version || 1;
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
        const result = db.exec(`SELECT data FROM worlds WHERE id = ?`, [id]);
        if (result.length === 0 || result[0].values.length === 0) return null;
        return JSON.parse(result[0].values[0][0] as string);
    }

    async getAllWorlds(): Promise<World[]> {
        const db = await this.getDb();
        const result = db.exec(`SELECT data FROM worlds ORDER BY created_at DESC`);
        if (result.length === 0) return [];
        return result[0].values.map((row: unknown[]) => JSON.parse(row[0] as string));
    }

    async saveWorld(world: World): Promise<void> {
        const db = await this.getDb();
        db.run(
            `INSERT OR REPLACE INTO worlds (id, data, created_at) VALUES (?, ?, ?)`,
            [world.id, JSON.stringify(world), world.createdAt]
        );
        saveToFile();
    }

    async deleteWorld(id: string): Promise<void> {
        const db = await this.getDb();
        db.run(`DELETE FROM worlds WHERE id = ?`, [id]);
        saveToFile();
    }

    // ============================================
    // 旅游会话操作
    // ============================================

    async getSession(id: string): Promise<TravelSession | null> {
        const db = await this.getDb();
        const result = db.exec(`SELECT data FROM sessions WHERE id = ?`, [id]);
        if (result.length === 0 || result[0].values.length === 0) return null;
        return JSON.parse(result[0].values[0][0] as string);
    }

    async getPlayerSessions(playerId: string): Promise<TravelSession[]> {
        const db = await this.getDb();
        const result = db.exec(
            `SELECT data FROM sessions WHERE player_id = ? ORDER BY created_at DESC`,
            [playerId]
        );
        if (result.length === 0) return [];
        return result[0].values.map((row: unknown[]) => JSON.parse(row[0] as string));
    }

    async saveSession(session: TravelSession): Promise<void> {
        const db = await this.getDb();
        db.run(
            `INSERT OR REPLACE INTO sessions (id, player_id, world_id, project_id, data, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                session.id,
                session.playerId,
                session.worldId,
                session.projectId,
                JSON.stringify(session),
                session.createdAt,
                session.updatedAt
            ]
        );
        saveToFile();
    }

    async getLatestPlayerSession(playerId: string): Promise<TravelSession | null> {
        const sessions = await this.getPlayerSessions(playerId);
        return sessions[0] || null;
    }

    // ============================================
    // 工具方法
    // ============================================

    async clear(): Promise<void> {
        const db = await this.getDb();
        db.run(`DELETE FROM settings`);
        db.run(`DELETE FROM worlds`);
        db.run(`DELETE FROM sessions`);
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

        const exportData: ExportData = {
            version: this.version,
            exportedAt: new Date().toISOString(),
            settings,
            worlds,
        };

        return JSON.stringify(exportData, null, 2);
    }

    async import(data: string): Promise<void> {
        const parsed = JSON.parse(data) as ExportData;

        // 导入设置
        for (const [key, value] of Object.entries(parsed.settings)) {
            await this.setSetting(key, value);
        }

        // 导入世界
        if (parsed.worlds) {
            for (const world of parsed.worlds) {
                await this.saveWorld(world);
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
