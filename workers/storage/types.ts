/**
 * 存储提供者类型定义
 */

import type { GameSave } from '~/types/game';
import type { World, TravelSession } from '~/types/world';

/**
 * 存储配置
 */
export interface StorageConfig {
    version?: number;
}

/**
 * 导出数据格式
 */
export interface ExportData {
    version: number;
    exportedAt: string;
    saves: GameSave[];
    settings: Record<string, unknown>;
}

/**
 * 存储提供者接口
 */
export interface IStorageProvider {
    // 存档操作
    getSave(id: string): Promise<GameSave | null>;
    getAllSaves(): Promise<GameSave[]>;
    saveSave(save: GameSave): Promise<void>;
    deleteSave(id: string): Promise<void>;

    // 设置操作
    getSetting<T>(key: string): Promise<T | null>;
    setSetting<T>(key: string, value: T): Promise<void>;

    // 世界数据操作
    getWorld(id: string): Promise<World | null>;
    getAllWorlds(): Promise<World[]>;
    saveWorld(world: World): Promise<void>;
    deleteWorld(id: string): Promise<void>;

    // 旅游会话操作
    getSession(id: string): Promise<TravelSession | null>;
    getPlayerSessions(playerId: string): Promise<TravelSession[]>;
    saveSession(session: TravelSession): Promise<void>;
    getLatestPlayerSession(playerId: string): Promise<TravelSession | null>;

    // 工具方法
    clear(): Promise<void>;
    export(): Promise<string>;
    import(data: string): Promise<void>;
    isAvailable(): Promise<boolean>;
}
