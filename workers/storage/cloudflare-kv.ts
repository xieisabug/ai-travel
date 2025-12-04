/**
 * Cloudflare KV 存储提供者
 *
 * 使用 Cloudflare KV 作为存储后端
 * 适用于 Cloudflare Workers 环境
 */

import type { World, TravelProject, TravelVehicle, Spot, SpotNPC, TravelSession } from '../../app/types/world';
import type { IStorageProvider, StorageConfig, ExportData, AICallRecord, AICallQueryParams, AICallStats } from './types';

// ============================================
// KV 键名前缀
// ============================================

const KEYS = {
    SETTING: 'setting:',
    WORLD: 'world:',
    WORLDS_INDEX: 'worlds:index',
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
    put(
        key: string,
        value: string | ArrayBuffer | ReadableStream,
        options?: {
            expiration?: number;
            expirationTtl?: number;
            metadata?: Record<string, unknown>;
        }
    ): Promise<void>;
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
    // 设置操作
    // ============================================

    async getSetting<T>(key: string): Promise<T | null> {
        const data = await this.kv.get(this.key(KEYS.SETTING + key), { type: 'json' });
        return data as T | null;
    }

    async setSetting<T>(key: string, value: T): Promise<void> {
        await this.kv.put(this.key(KEYS.SETTING + key), JSON.stringify(value));
    }

    // ============================================
    // 世界数据操作
    // ============================================

    async getWorld(id: string): Promise<World | null> {
        const data = await this.kv.get(this.key(KEYS.WORLD + id), { type: 'json' });
        return data as World | null;
    }

    async getAllWorlds(): Promise<World[]> {
        const indexData = await this.kv.get(this.key(KEYS.WORLDS_INDEX), { type: 'json' });
        const worldIds = (indexData as string[]) || [];

        const worlds = await Promise.all(worldIds.map((id) => this.getWorld(id)));

        return worlds
            .filter((world): world is World => world !== null)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async saveWorld(world: World): Promise<void> {
        await this.kv.put(this.key(KEYS.WORLD + world.id), JSON.stringify(world));

        // 更新索引
        const indexData = await this.kv.get(this.key(KEYS.WORLDS_INDEX), { type: 'json' });
        const worldIds = new Set((indexData as string[]) || []);
        worldIds.add(world.id);
        await this.kv.put(this.key(KEYS.WORLDS_INDEX), JSON.stringify([...worldIds]));
    }

    async deleteWorld(id: string): Promise<void> {
        await this.kv.delete(this.key(KEYS.WORLD + id));

        // 更新索引
        const indexData = await this.kv.get(this.key(KEYS.WORLDS_INDEX), { type: 'json' });
        const worldIds = new Set((indexData as string[]) || []);
        worldIds.delete(id);
        await this.kv.put(this.key(KEYS.WORLDS_INDEX), JSON.stringify([...worldIds]));
    }

    // ============================================
    // 旅游会话操作
    // ============================================

    async getSession(id: string): Promise<TravelSession | null> {
        const data = await this.kv.get(this.key(KEYS.SESSION + id), { type: 'json' });
        return data as TravelSession | null;
    }

    async getPlayerSessions(playerId: string): Promise<TravelSession[]> {
        const indexData = await this.kv.get(this.key(KEYS.PLAYER_SESSIONS + playerId), {
            type: 'json',
        });
        const sessionIds = (indexData as string[]) || [];

        const sessions = await Promise.all(sessionIds.map((id) => this.getSession(id)));

        return sessions
            .filter((session): session is TravelSession => session !== null)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async saveSession(session: TravelSession): Promise<void> {
        await this.kv.put(this.key(KEYS.SESSION + session.id), JSON.stringify(session));

        // 更新玩家会话索引
        const indexData = await this.kv.get(this.key(KEYS.PLAYER_SESSIONS + session.playerId), {
            type: 'json',
        });
        const sessionIds = new Set((indexData as string[]) || []);
        sessionIds.add(session.id);
        await this.kv.put(
            this.key(KEYS.PLAYER_SESSIONS + session.playerId),
            JSON.stringify([...sessionIds])
        );
    }

    async getLatestPlayerSession(playerId: string): Promise<TravelSession | null> {
        const sessions = await this.getPlayerSessions(playerId);
        return sessions[0] || null;
    }

    // ============================================
    // 旅行器操作 (未实现 - 使用 SQLite)
    // ============================================

    async getVehicle(_id: string): Promise<TravelVehicle | null> {
        throw new Error('CloudflareKV: getVehicle not implemented, use SQLite provider');
    }

    async getVehicleByWorldId(_worldId: string): Promise<TravelVehicle | null> {
        throw new Error('CloudflareKV: getVehicleByWorldId not implemented, use SQLite provider');
    }

    async saveVehicle(_vehicle: TravelVehicle, _worldId: string): Promise<void> {
        throw new Error('CloudflareKV: saveVehicle not implemented, use SQLite provider');
    }

    // ============================================
    // 旅游项目操作 (未实现 - 使用 SQLite)
    // ============================================

    async getProject(_id: string): Promise<TravelProject | null> {
        throw new Error('CloudflareKV: getProject not implemented, use SQLite provider');
    }

    async getProjectsByWorldId(_worldId: string): Promise<TravelProject[]> {
        throw new Error('CloudflareKV: getProjectsByWorldId not implemented, use SQLite provider');
    }

    async saveProject(_project: TravelProject): Promise<void> {
        throw new Error('CloudflareKV: saveProject not implemented, use SQLite provider');
    }

    // ============================================
    // 景点操作 (未实现 - 使用 SQLite)
    // ============================================

    async getSpot(_id: string): Promise<Spot | null> {
        throw new Error('CloudflareKV: getSpot not implemented, use SQLite provider');
    }

    async getSpotsByProjectId(_projectId: string): Promise<Spot[]> {
        throw new Error('CloudflareKV: getSpotsByProjectId not implemented, use SQLite provider');
    }

    async saveSpot(_spot: Spot): Promise<void> {
        throw new Error('CloudflareKV: saveSpot not implemented, use SQLite provider');
    }

    // ============================================
    // NPC 操作 (未实现 - 使用 SQLite)
    // ============================================

    async getNPC(_id: string): Promise<SpotNPC | null> {
        throw new Error('CloudflareKV: getNPC not implemented, use SQLite provider');
    }

    async getNPCsBySpotId(_spotId: string): Promise<SpotNPC[]> {
        throw new Error('CloudflareKV: getNPCsBySpotId not implemented, use SQLite provider');
    }

    async saveNPC(_npc: SpotNPC, _spotId: string): Promise<void> {
        throw new Error('CloudflareKV: saveNPC not implemented, use SQLite provider');
    }

    // ============================================
    // AI 调用记录操作 (未实现 - 使用 SQLite)
    // ============================================

    async saveAICall(_record: AICallRecord): Promise<void> {
        throw new Error('CloudflareKV: saveAICall not implemented, use SQLite provider');
    }

    async getAICall(_id: string): Promise<AICallRecord | null> {
        throw new Error('CloudflareKV: getAICall not implemented, use SQLite provider');
    }

    async getAICalls(_params?: AICallQueryParams): Promise<AICallRecord[]> {
        throw new Error('CloudflareKV: getAICalls not implemented, use SQLite provider');
    }

    async getAICallStats(_params?: AICallQueryParams): Promise<AICallStats> {
        throw new Error('CloudflareKV: getAICallStats not implemented, use SQLite provider');
    }

    // ============================================
    // 工具方法
    // ============================================

    async clear(): Promise<void> {
        // KV 不支持批量删除，需要逐个删除
        const listResult = await this.kv.list({ prefix: this.prefix });
        for (const key of listResult.keys) {
            await this.kv.delete(key.name);
        }
    }

    async export(): Promise<string> {
        const worlds = await this.getAllWorlds();

        const exportData: ExportData = {
            version: this.version,
            exportedAt: new Date().toISOString(),
            settings: {},
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
            await this.kv.get('test');
            return true;
        } catch {
            return false;
        }
    }
}
