/**
 * 存储抽象层 - 类型定义
 */

import type { GameSave } from '~/types/game';

/**
 * 存储提供者接口
 * 
 * 所有存储实现都需要实现此接口，以便于切换存储后端
 * 当前实现: LocalStorageProvider
 * 未来可扩展: CloudflareKVProvider, IndexedDBProvider
 */
export interface IStorageProvider {
    // ============================================
    // 存档操作
    // ============================================

    /**
     * 获取单个存档
     * @param id 存档 ID
     * @returns 存档数据，不存在返回 null
     */
    getSave(id: string): Promise<GameSave | null>;

    /**
     * 获取所有存档列表
     * @returns 存档列表（按更新时间降序）
     */
    getAllSaves(): Promise<GameSave[]>;

    /**
     * 保存存档（创建或更新）
     * @param save 存档数据
     */
    saveSave(save: GameSave): Promise<void>;

    /**
     * 删除存档
     * @param id 存档 ID
     */
    deleteSave(id: string): Promise<void>;

    // ============================================
    // 设置操作
    // ============================================

    /**
     * 获取设置项
     * @param key 设置键名
     * @returns 设置值，不存在返回 null
     */
    getSetting<T>(key: string): Promise<T | null>;

    /**
     * 保存设置项
     * @param key 设置键名
     * @param value 设置值
     */
    setSetting<T>(key: string, value: T): Promise<void>;

    // ============================================
    // 工具方法
    // ============================================

    /**
     * 清空所有数据
     */
    clear(): Promise<void>;

    /**
     * 导出所有数据为 JSON 字符串
     * @returns JSON 字符串
     */
    export(): Promise<string>;

    /**
     * 从 JSON 字符串导入数据
     * @param data JSON 字符串
     */
    import(data: string): Promise<void>;

    /**
     * 检查存储是否可用
     */
    isAvailable(): Promise<boolean>;
}

/**
 * 存储配置
 */
export interface StorageConfig {
    /** 存储前缀（用于命名空间隔离） */
    prefix?: string;
    /** 存档版本号 */
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
 * 存储提供者类型
 */
export type StorageProviderType = 'localStorage' | 'cloudflareKV' | 'indexedDB';
