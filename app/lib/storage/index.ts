/**
 * 存储抽象层 - 入口文件
 * 
 * 提供统一的存储访问接口，支持多种存储后端
 */

export type {
    IStorageProvider,
    StorageConfig,
    ExportData,
    StorageProviderType
} from './types';

export { LocalStorageProvider } from './local-storage';
export { CloudflareKVProvider, type KVNamespace, type IExtendedStorageProvider } from './cloudflare-kv';

import type { IStorageProvider, StorageProviderType, StorageConfig } from './types';
import { LocalStorageProvider } from './local-storage';
import { CloudflareKVProvider, type KVNamespace } from './cloudflare-kv';

/**
 * 创建存储提供者实例
 * 
 * @param type 存储类型
 * @param config 存储配置
 * @param kv Cloudflare KV 命名空间（仅 cloudflareKV 类型需要）
 * @returns 存储提供者实例
 * 
 * @example
 * ```ts
 * // 使用 LocalStorage
 * const storage = createStorageProvider('localStorage');
 * 
 * // 使用 Cloudflare KV
 * const storage = createStorageProvider('cloudflareKV', { prefix: 'my-app' }, env.KV);
 * ```
 */
export function createStorageProvider(
    type: StorageProviderType = 'localStorage',
    config: StorageConfig = {},
    kv?: KVNamespace
): IStorageProvider {
    switch (type) {
        case 'localStorage':
            return new LocalStorageProvider(config);

        case 'cloudflareKV':
            if (!kv) {
                console.warn('CloudflareKV requires KV namespace, falling back to localStorage');
                return new LocalStorageProvider(config);
            }
            return new CloudflareKVProvider(kv, config);

        case 'indexedDB':
            // TODO: 实现 IndexedDBProvider
            console.warn('IndexedDB provider not implemented, falling back to localStorage');
            return new LocalStorageProvider(config);

        default:
            return new LocalStorageProvider(config);
    }
}

// 默认存储实例（单例）
let defaultStorageInstance: IStorageProvider | null = null;

/**
 * 获取默认存储实例（单例模式）
 * 
 * @returns 默认存储提供者实例
 * 
 * @example
 * ```ts
 * const storage = getDefaultStorage();
 * const saves = await storage.getAllSaves();
 * ```
 */
export function getDefaultStorage(): IStorageProvider {
    if (!defaultStorageInstance) {
        defaultStorageInstance = createStorageProvider('localStorage');
    }
    return defaultStorageInstance;
}

/**
 * 设置默认存储实例
 * 
 * @param provider 存储提供者实例
 * 
 * @example
 * ```ts
 * // 切换到 CloudflareKV
 * const kvProvider = createStorageProvider('cloudflareKV', { ... });
 * setDefaultStorage(kvProvider);
 * ```
 */
export function setDefaultStorage(provider: IStorageProvider): void {
    defaultStorageInstance = provider;
}
