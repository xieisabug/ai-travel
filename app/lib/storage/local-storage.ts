/**
 * LocalStorage 存储提供者实现
 * 
 * 使用浏览器 LocalStorage 作为存储后端
 * 适用于单机游戏，数据保存在用户浏览器中
 */

import type { GameSave } from '~/types/game';
import type { IStorageProvider, StorageConfig, ExportData } from './types';

const DEFAULT_PREFIX = 'ai-travel';
const CURRENT_VERSION = 1;

/**
 * LocalStorage 存储提供者
 */
export class LocalStorageProvider implements IStorageProvider {
    private prefix: string;
    private version: number;

    constructor(config: StorageConfig = {}) {
        this.prefix = config.prefix || DEFAULT_PREFIX;
        this.version = config.version || CURRENT_VERSION;
    }

    /**
     * 生成存储键名
     */
    private getKey(type: 'save' | 'settings', id?: string): string {
        if (type === 'save' && id) {
            return `${this.prefix}:save:${id}`;
        }
        if (type === 'settings') {
            return `${this.prefix}:settings:${id || 'global'}`;
        }
        return `${this.prefix}:${type}`;
    }

    /**
     * 获取所有存档的键名列表
     */
    private getSaveKeys(): string[] {
        const keys: string[] = [];
        const savePrefix = `${this.prefix}:save:`;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(savePrefix)) {
                keys.push(key);
            }
        }

        return keys;
    }

    // ============================================
    // 存档操作
    // ============================================

    async getSave(id: string): Promise<GameSave | null> {
        try {
            const key = this.getKey('save', id);
            const data = localStorage.getItem(key);

            if (!data) {
                return null;
            }

            return JSON.parse(data) as GameSave;
        } catch (error) {
            console.error('Failed to get save:', error);
            return null;
        }
    }

    async getAllSaves(): Promise<GameSave[]> {
        try {
            const keys = this.getSaveKeys();
            const saves: GameSave[] = [];

            for (const key of keys) {
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        saves.push(JSON.parse(data) as GameSave);
                    } catch {
                        console.warn('Failed to parse save:', key);
                    }
                }
            }

            // 按更新时间降序排列
            saves.sort((a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );

            return saves;
        } catch (error) {
            console.error('Failed to get all saves:', error);
            return [];
        }
    }

    async saveSave(save: GameSave): Promise<void> {
        try {
            const key = this.getKey('save', save.id);
            const data = JSON.stringify(save);
            localStorage.setItem(key, data);
        } catch (error) {
            console.error('Failed to save:', error);
            throw new Error('存储空间不足或存储被禁用');
        }
    }

    async deleteSave(id: string): Promise<void> {
        try {
            const key = this.getKey('save', id);
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Failed to delete save:', error);
        }
    }

    // ============================================
    // 设置操作
    // ============================================

    async getSetting<T>(key: string): Promise<T | null> {
        try {
            const storageKey = this.getKey('settings', key);
            const data = localStorage.getItem(storageKey);

            if (!data) {
                return null;
            }

            return JSON.parse(data) as T;
        } catch (error) {
            console.error('Failed to get setting:', error);
            return null;
        }
    }

    async setSetting<T>(key: string, value: T): Promise<void> {
        try {
            const storageKey = this.getKey('settings', key);
            const data = JSON.stringify(value);
            localStorage.setItem(storageKey, data);
        } catch (error) {
            console.error('Failed to set setting:', error);
            throw new Error('存储空间不足或存储被禁用');
        }
    }

    // ============================================
    // 工具方法
    // ============================================

    async clear(): Promise<void> {
        try {
            const keysToRemove: string[] = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }

            for (const key of keysToRemove) {
                localStorage.removeItem(key);
            }
        } catch (error) {
            console.error('Failed to clear storage:', error);
        }
    }

    async export(): Promise<string> {
        try {
            const saves = await this.getAllSaves();
            const settings: Record<string, unknown> = {};

            // 收集所有设置
            const settingsPrefix = `${this.prefix}:settings:`;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(settingsPrefix)) {
                    const settingKey = key.replace(settingsPrefix, '');
                    const data = localStorage.getItem(key);
                    if (data) {
                        try {
                            settings[settingKey] = JSON.parse(data);
                        } catch {
                            settings[settingKey] = data;
                        }
                    }
                }
            }

            const exportData: ExportData = {
                version: this.version,
                exportedAt: new Date().toISOString(),
                saves,
                settings,
            };

            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('Failed to export:', error);
            throw new Error('导出失败');
        }
    }

    async import(data: string): Promise<void> {
        try {
            const importData = JSON.parse(data) as ExportData;

            // 验证版本
            if (importData.version > this.version) {
                throw new Error('导入的数据版本过高，请更新应用');
            }

            // 导入存档
            for (const save of importData.saves) {
                await this.saveSave(save);
            }

            // 导入设置
            for (const [key, value] of Object.entries(importData.settings)) {
                await this.setSetting(key, value);
            }
        } catch (error) {
            console.error('Failed to import:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('导入的数据格式无效');
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            const testKey = `${this.prefix}:test`;
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch {
            return false;
        }
    }
}
