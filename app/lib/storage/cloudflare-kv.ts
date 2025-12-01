/**
 * Cloudflare KV 存储提供者
 * 
 * 使用 Cloudflare KV 作为存储后端
 * 适用于 Cloudflare Workers 环境
 */

import type { GameSave } from '~/types/game';
import type { World, TravelProject, TravelSession } from '~/types/world';
import type { IStorageProvider, StorageConfig, ExportData } from './types';

// ============================================
// KV 键名前缀
// ============================================

const KEYS = {
    SAVE: 'save:',
    SAVES_INDEX: 'saves:index',
    SETTING: 'setting:',
    WORLD: 'world:',
    WORLDS_INDEX: 'worlds:index',
    PROJECT: 'project:',
    SESSION: 'session:',
    PLAYER_SESSIONS: 'player_sessions:',
} as const;

// ============================================
// KV 绑定类型
// ============================================

/**
 * Cloudflare KV 命名空间接口
 */
export interface KVNamespace {
    get(key: string, options?: { type?: 'text' }): Promise<string | null>;
    get(key: string, options: { type: 'json' }): Promise<unknown>;
    get(key: string, options: { type: 'arrayBuffer' }): Promise<ArrayBuffer | null>;
    get(key: string, options: { type: 'stream' }): Promise<ReadableStream | null>;
    put(key: string, value: string | ArrayBuffer | ReadableStream, options?: {
        expiration?: number;
        expirationTtl?: number;
        metadata?: Record<string, unknown>;
    }): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: {
        prefix?: string;
        limit?: number;
        cursor?: string;
    }): Promise<{
        keys: Array<{ name: string; expiration?: number; metadata?: Record<string, unknown> }>;
        list_complete: boolean;
        cursor?: string;
    }>;
}

// ============================================
// Cloudflare KV 存储提供者实现
// ============================================

export class CloudflareKVProvider implements IStorageProvider {
    private kv: KVNamespace;
    private prefix: string;
    private version: number;

    constructor(kv: KVNamespace, config: StorageConfig = {}) {
        this.kv = kv;
        this.prefix = config.prefix || 'ai-travel';
        this.version = config.version || 1;
    }

    /**
     * 生成完整的键名
     */
    private key(suffix: string): string {
        return `${this.prefix}:${suffix}`;
    }

    // ============================================
    // 存档操作
    // ============================================

    async getSave(id: string): Promise<GameSave | null> {
        const data = await this.kv.get(this.key(KEYS.SAVE + id), { type: 'json' });
        return data as GameSave | null;
    }

    async getAllSaves(): Promise<GameSave[]> {
        // 从索引获取所有存档 ID
        const indexData = await this.kv.get(this.key(KEYS.SAVES_INDEX), { type: 'json' });
        const saveIds = (indexData as string[]) || [];

        // 并行获取所有存档
        const saves = await Promise.all(
            saveIds.map(id => this.getSave(id))
        );

        // 过滤 null 并按更新时间排序
        return saves
            .filter((save): save is GameSave => save !== null)
            .sort((a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
    }

    async saveSave(save: GameSave): Promise<void> {
        // 保存存档数据
        await this.kv.put(
            this.key(KEYS.SAVE + save.id),
            JSON.stringify(save)
        );

        // 更新索引
        const indexData = await this.kv.get(this.key(KEYS.SAVES_INDEX), { type: 'json' });
        const saveIds = (indexData as string[]) || [];

        if (!saveIds.includes(save.id)) {
            saveIds.push(save.id);
            await this.kv.put(
                this.key(KEYS.SAVES_INDEX),
                JSON.stringify(saveIds)
            );
        }
    }

    async deleteSave(id: string): Promise<void> {
        // 删除存档数据
        await this.kv.delete(this.key(KEYS.SAVE + id));

        // 更新索引
        const indexData = await this.kv.get(this.key(KEYS.SAVES_INDEX), { type: 'json' });
        const saveIds = (indexData as string[]) || [];
        const newIds = saveIds.filter(saveId => saveId !== id);

        await this.kv.put(
            this.key(KEYS.SAVES_INDEX),
            JSON.stringify(newIds)
        );
    }

    // ============================================
    // 设置操作
    // ============================================

    async getSetting<T>(key: string): Promise<T | null> {
        const data = await this.kv.get(this.key(KEYS.SETTING + key), { type: 'json' });
        return data as T | null;
    }

    async setSetting<T>(key: string, value: T): Promise<void> {
        await this.kv.put(
            this.key(KEYS.SETTING + key),
            JSON.stringify(value)
        );
    }

    // ============================================
    // 世界数据操作（扩展）
    // ============================================

    async getWorld(id: string): Promise<World | null> {
        const data = await this.kv.get(this.key(KEYS.WORLD + id), { type: 'json' });
        return data as World | null;
    }

    async getAllWorlds(): Promise<World[]> {
        const indexData = await this.kv.get(this.key(KEYS.WORLDS_INDEX), { type: 'json' });
        const worldIds = (indexData as string[]) || [];

        const worlds = await Promise.all(
            worldIds.map(id => this.getWorld(id))
        );

        return worlds
            .filter((world): world is World => world !== null)
            .sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
    }

    async saveWorld(world: World): Promise<void> {
        await this.kv.put(
            this.key(KEYS.WORLD + world.id),
            JSON.stringify(world)
        );

        // 更新索引
        const indexData = await this.kv.get(this.key(KEYS.WORLDS_INDEX), { type: 'json' });
        const worldIds = (indexData as string[]) || [];

        if (!worldIds.includes(world.id)) {
            worldIds.push(world.id);
            await this.kv.put(
                this.key(KEYS.WORLDS_INDEX),
                JSON.stringify(worldIds)
            );
        }
    }

    async deleteWorld(id: string): Promise<void> {
        await this.kv.delete(this.key(KEYS.WORLD + id));

        const indexData = await this.kv.get(this.key(KEYS.WORLDS_INDEX), { type: 'json' });
        const worldIds = (indexData as string[]) || [];
        const newIds = worldIds.filter(worldId => worldId !== id);

        await this.kv.put(
            this.key(KEYS.WORLDS_INDEX),
            JSON.stringify(newIds)
        );
    }

    // ============================================
    // 旅游会话操作（扩展）
    // ============================================

    async getSession(id: string): Promise<TravelSession | null> {
        const data = await this.kv.get(this.key(KEYS.SESSION + id), { type: 'json' });
        return data as TravelSession | null;
    }

    async getPlayerSessions(playerId: string): Promise<TravelSession[]> {
        const indexData = await this.kv.get(
            this.key(KEYS.PLAYER_SESSIONS + playerId),
            { type: 'json' }
        );
        const sessionIds = (indexData as string[]) || [];

        const sessions = await Promise.all(
            sessionIds.map(id => this.getSession(id))
        );

        return sessions
            .filter((session): session is TravelSession => session !== null)
            .sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
    }

    async saveSession(session: TravelSession): Promise<void> {
        await this.kv.put(
            this.key(KEYS.SESSION + session.id),
            JSON.stringify(session)
        );

        // 更新玩家会话索引
        const indexData = await this.kv.get(
            this.key(KEYS.PLAYER_SESSIONS + session.playerId),
            { type: 'json' }
        );
        const sessionIds = (indexData as string[]) || [];

        if (!sessionIds.includes(session.id)) {
            sessionIds.push(session.id);
            await this.kv.put(
                this.key(KEYS.PLAYER_SESSIONS + session.playerId),
                JSON.stringify(sessionIds)
            );
        }
    }

    async getLatestPlayerSession(playerId: string): Promise<TravelSession | null> {
        const sessions = await this.getPlayerSessions(playerId);
        return sessions[0] || null;
    }

    // ============================================
    // 工具方法
    // ============================================

    async clear(): Promise<void> {
        // 列出所有带前缀的键
        let cursor: string | undefined;
        const keysToDelete: string[] = [];

        do {
            const result = await this.kv.list({
                prefix: this.prefix,
                cursor,
            });

            keysToDelete.push(...result.keys.map(k => k.name));
            cursor = result.list_complete ? undefined : result.cursor;
        } while (cursor);

        // 删除所有键
        await Promise.all(keysToDelete.map(key => this.kv.delete(key)));
    }

    async export(): Promise<string> {
        const saves = await this.getAllSaves();
        const worlds = await this.getAllWorlds();

        // 获取所有设置（需要列出）
        const settings: Record<string, unknown> = {};
        let cursor: string | undefined;

        do {
            const result = await this.kv.list({
                prefix: this.key(KEYS.SETTING),
                cursor,
            });

            for (const key of result.keys) {
                const settingKey = key.name.replace(this.key(KEYS.SETTING), '');
                settings[settingKey] = await this.getSetting(settingKey);
            }

            cursor = result.list_complete ? undefined : result.cursor;
        } while (cursor);

        const exportData: ExportData & { worlds: World[] } = {
            version: this.version,
            exportedAt: new Date().toISOString(),
            saves,
            settings,
            worlds,
        };

        return JSON.stringify(exportData, null, 2);
    }

    async import(data: string): Promise<void> {
        const parsed = JSON.parse(data) as ExportData & { worlds?: World[] };

        // 导入存档
        for (const save of parsed.saves) {
            await this.saveSave(save);
        }

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
            // 尝试一个简单的读操作
            await this.kv.get(this.key('_health_check'));
            return true;
        } catch {
            return false;
        }
    }
}

// ============================================
// 扩展存储接口（包含世界和会话）
// ============================================

export interface IExtendedStorageProvider extends IStorageProvider {
    // 世界操作
    getWorld(id: string): Promise<World | null>;
    getAllWorlds(): Promise<World[]>;
    saveWorld(world: World): Promise<void>;
    deleteWorld(id: string): Promise<void>;

    // 会话操作
    getSession(id: string): Promise<TravelSession | null>;
    getPlayerSessions(playerId: string): Promise<TravelSession[]>;
    saveSession(session: TravelSession): Promise<void>;
    getLatestPlayerSession(playerId: string): Promise<TravelSession | null>;
}
