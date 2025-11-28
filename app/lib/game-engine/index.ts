/**
 * 游戏引擎 - 入口文件
 */

import type {
    GameState,
    GameSave,
    GamePhase,
    GameEffect,
    DialogNode,
    Scene,
    CreateSaveParams,
} from '~/types/game';

import type {
    IGameEngine,
    GameAction,
    GameEventType,
    GameEventListener,
    GameEvent,
    GameEngineConfig,
} from './types';

import { StateManager } from './state-manager';
import { getDefaultStorage, type IStorageProvider } from '~/lib/storage';

export type { IGameEngine, GameAction, GameEventType, GameEvent, GameEngineConfig };
export { StateManager } from './state-manager';

/**
 * 游戏引擎实现
 */
export class GameEngine implements IGameEngine {
    private stateManager: StateManager;
    private storage: IStorageProvider;
    private eventListeners: Map<GameEventType, Set<GameEventListener<unknown>>> = new Map();
    private config: GameEngineConfig;
    private autoSaveTimer: ReturnType<typeof setInterval> | null = null;

    constructor(config: GameEngineConfig = {}) {
        this.config = {
            autoSaveInterval: 30000, // 30秒自动保存
            typewriterSpeed: 50,
            debug: false,
            ...config,
        };

        this.stateManager = new StateManager();
        this.storage = getDefaultStorage();

        // 订阅状态变化
        this.stateManager.subscribe((state) => {
            this.onStateChange(state);
        });
    }

    // ============================================
    // 状态访问
    // ============================================

    getState(): GameState {
        return this.stateManager.getState();
    }

    getSave(): GameSave | null {
        return this.stateManager.getSave();
    }

    getCurrentDialogNode(): DialogNode | null {
        return this.stateManager.getState().currentDialogNode;
    }

    getCurrentScene(): Scene | null {
        return this.stateManager.getState().currentScene;
    }

    getAvailableChoices(): DialogNode['choices'] {
        const node = this.getCurrentDialogNode();
        if (!node?.choices) return undefined;

        // 过滤掉不满足条件的选项
        return node.choices.filter(choice => {
            if (!choice.condition) return true;
            return this.checkCondition(choice.condition);
        });
    }

    // ============================================
    // 动作分发
    // ============================================

    async dispatch(action: GameAction): Promise<void> {
        if (this.config.debug) {
            console.log('[GameEngine] Dispatch:', action.type, action);
        }

        switch (action.type) {
            case 'START_NEW_GAME':
                await this.startNewGame(action.payload);
                break;

            case 'LOAD_SAVE':
                await this.loadSave(action.payload);
                break;

            case 'CHANGE_PHASE':
                this.changePhase(action.payload);
                break;

            case 'CHANGE_SCENE':
                this.changeScene(action.payload);
                break;

            case 'START_DIALOG':
                this.startDialog(action.payload);
                break;

            case 'ADVANCE_DIALOG':
                await this.advanceDialog();
                break;

            case 'MAKE_CHOICE':
                await this.makeChoice(action.payload);
                break;

            case 'COMPLETE_TYPEWRITER':
                this.stateManager.completeTypewriter();
                break;

            case 'ADD_ITEM':
                this.stateManager.addItem(action.payload);
                this.emit('item_added', action.payload);
                break;

            case 'REMOVE_ITEM':
                this.stateManager.removeItem(action.payload);
                this.emit('item_removed', { itemId: action.payload });
                break;

            case 'ADD_MEMORY':
                this.stateManager.addMemory(action.payload);
                this.emit('memory_added', action.payload);
                break;

            case 'SET_FLAG':
                this.stateManager.setFlag(action.payload.key, action.payload.value);
                this.emit('flag_changed', action.payload);
                break;

            case 'UNLOCK_ACHIEVEMENT':
                this.stateManager.unlockAchievement(action.payload);
                this.emit('achievement_unlocked', { achievementId: action.payload });
                break;

            case 'SAVE_GAME':
                await this.saveGame();
                break;

            case 'TOGGLE_MENU':
                this.stateManager.toggleMenu();
                break;

            case 'TOGGLE_INVENTORY':
                this.stateManager.toggleInventory();
                break;

            case 'TOGGLE_MEMORIES':
                this.stateManager.toggleMemories();
                break;
        }
    }

    // ============================================
    // 游戏控制
    // ============================================

    private async startNewGame(params: CreateSaveParams): Promise<void> {
        this.stateManager.startNewGame(params);

        const save = this.getSave();
        if (save) {
            await this.storage.saveSave(save);
            this.emit('save_created', save);
        }

        this.startAutoSave();

        // 处理初始场景的入口对话效果
        const state = this.getState();
        if (state.currentDialogNode?.effects) {
            await this.executeEffects(state.currentDialogNode.effects);
        }
    }

    private async loadSave(saveId: string): Promise<void> {
        const save = await this.storage.getSave(saveId);
        if (!save) {
            this.emit('error', { message: '存档不存在' });
            return;
        }

        this.stateManager.loadSave(save);
        this.emit('save_loaded', save);
        this.startAutoSave();
    }

    private changePhase(phase: GamePhase): void {
        const previousPhase = this.getSave()?.currentPhase;
        this.stateManager.changePhase(phase);
        this.emit('phase_changed', { from: previousPhase, to: phase });
    }

    private changeScene(sceneId: string): void {
        const previousScene = this.getCurrentScene()?.id;
        this.stateManager.changeScene(sceneId);
        this.emit('scene_changed', { from: previousScene, to: sceneId });
    }

    private startDialog(scriptId: string): void {
        this.stateManager.startDialog(scriptId);
        this.emit('dialog_started', { scriptId });
    }

    private async advanceDialog(): Promise<void> {
        const previousNode = this.getCurrentDialogNode();
        const nextNode = this.stateManager.advanceDialog();

        if (nextNode && previousNode?.id !== nextNode.id) {
            this.emit('dialog_advanced', { from: previousNode?.id, to: nextNode.id });

            // 处理对话节点的效果
            if (nextNode.effects) {
                await this.executeEffects(nextNode.effects);
            }
        } else if (!nextNode) {
            this.emit('dialog_ended', { lastNodeId: previousNode?.id });
        }
    }

    private async makeChoice(choiceId: string): Promise<void> {
        const currentNode = this.getCurrentDialogNode();
        const choice = currentNode?.choices?.find(c => c.id === choiceId);

        // 先处理选项的效果
        if (choice?.effects) {
            await this.executeEffects(choice.effects);
        }

        const nextNode = this.stateManager.makeChoice(choiceId);
        this.emit('choice_made', { choiceId, nextNodeId: nextNode?.id });

        // 处理新节点的效果
        if (nextNode?.effects) {
            await this.executeEffects(nextNode.effects);
        }
    }

    private async saveGame(): Promise<void> {
        const save = this.getSave();
        if (save) {
            await this.storage.saveSave(save);
            this.emit('save_updated', save);
        }
    }

    // ============================================
    // 效果执行
    // ============================================

    async executeEffects(effects: GameEffect[]): Promise<void> {
        for (const effect of effects) {
            await this.executeEffect(effect);
        }
    }

    private async executeEffect(effect: GameEffect): Promise<void> {
        const payload = effect.payload as Record<string, unknown>;

        switch (effect.type) {
            case 'set_flag':
                this.stateManager.setFlag(
                    payload.key as string,
                    payload.value as boolean | string | number
                );
                break;

            case 'add_item':
                if (payload.item) {
                    this.stateManager.addItem(payload.item as GameSave['inventory'][0]);
                    this.emit('item_added', payload.item);
                }
                break;

            case 'remove_item':
                this.stateManager.removeItem(payload.itemId as string);
                this.emit('item_removed', payload);
                break;

            case 'add_memory':
                if (payload.memory) {
                    this.stateManager.addMemory(payload.memory as GameSave['memories'][0]);
                    this.emit('memory_added', payload.memory);
                }
                break;

            case 'unlock_achievement':
                this.stateManager.unlockAchievement(payload.achievementId as string);
                this.emit('achievement_unlocked', payload);
                break;

            case 'change_scene':
                this.changeScene(payload.sceneId as string);
                break;

            case 'change_phase':
                this.changePhase(payload.phase as GamePhase);
                break;

            case 'play_sound':
                // TODO: 实现音效播放
                break;

            case 'shake_screen':
                // TODO: 实现屏幕震动
                break;
        }
    }

    // ============================================
    // 条件检查
    // ============================================

    checkCondition(condition: string): boolean {
        return this.stateManager.checkCondition(condition);
    }

    // ============================================
    // 事件系统
    // ============================================

    on<T = unknown>(event: GameEventType, listener: GameEventListener<T>): () => void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }

        this.eventListeners.get(event)!.add(listener as GameEventListener<unknown>);

        return () => this.off(event, listener);
    }

    off<T = unknown>(event: GameEventType, listener: GameEventListener<T>): void {
        this.eventListeners.get(event)?.delete(listener as GameEventListener<unknown>);
    }

    private emit<T>(type: GameEventType, payload: T): void {
        const event: GameEvent<T> = {
            type,
            payload,
            timestamp: Date.now(),
        };

        if (this.config.debug) {
            console.log('[GameEngine] Event:', type, payload);
        }

        const listeners = this.eventListeners.get(type);
        if (listeners) {
            for (const listener of listeners) {
                try {
                    listener(event as GameEvent<unknown>);
                } catch (error) {
                    console.error(`[GameEngine] Error in event listener for ${type}:`, error);
                }
            }
        }
    }

    // ============================================
    // 自动保存
    // ============================================

    private startAutoSave(): void {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }

        if (this.config.autoSaveInterval && this.config.autoSaveInterval > 0) {
            this.autoSaveTimer = setInterval(() => {
                this.saveGame();
            }, this.config.autoSaveInterval);
        }
    }

    private stopAutoSave(): void {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    // ============================================
    // 状态变化回调
    // ============================================

    private onStateChange(_state: GameState): void {
        // 可以在这里添加全局的状态变化处理
    }

    // ============================================
    // 清理
    // ============================================

    destroy(): void {
        this.stopAutoSave();
        this.eventListeners.clear();
    }
}

// 默认引擎实例（单例）
let defaultEngineInstance: GameEngine | null = null;

/**
 * 获取默认游戏引擎实例
 */
export function getDefaultEngine(config?: GameEngineConfig): GameEngine {
    if (!defaultEngineInstance) {
        defaultEngineInstance = new GameEngine(config);
    }
    return defaultEngineInstance;
}

/**
 * 设置默认游戏引擎实例
 */
export function setDefaultEngine(engine: GameEngine): void {
    defaultEngineInstance = engine;
}
