/**
 * 游戏引擎 - 状态管理器
 */

import type {
    GameState,
    GameSave,
    GamePhase,
    DialogNode,
    DialogScript,
    Scene,
    InventoryItem,
    Memory,
    CreateSaveParams,
} from '~/types/game';

import { getSceneById, getPhaseStartScene } from '~/data/scenes';
import { getDialogScriptById, getDialogNodeById, getPhaseStartDialog } from '~/data/dialogs';

/**
 * 生成唯一 ID
 */
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 创建初始游戏状态
 */
export function createInitialState(): GameState {
    return {
        isLoaded: false,
        isLoading: false,
        save: null,

        showDialog: false,
        showChoices: false,
        showMenu: false,
        showInventory: false,
        showMemories: false,

        currentDialogNode: null,
        currentDialogScript: null,
        typewriterComplete: false,

        currentScene: null,
        currentBackground: null,
        currentCharacterSprite: null,
    };
}

/**
 * 创建新存档
 */
export function createNewSave(params: CreateSaveParams): GameSave {
    const now = new Date().toISOString();
    const startPhase: GamePhase = 'planning';
    const startScene = getPhaseStartScene(startPhase);

    return {
        id: generateId(),
        version: 1,
        createdAt: now,
        updatedAt: now,

        player: {
            name: params.playerName,
            avatar: params.playerAvatar,
        },

        currentPhase: startPhase,
        currentSceneId: startScene?.id || 'scene_home_planning',
        currentDialogId: undefined,
        currentDialogScriptId: undefined,
        readDialogIds: [],

        selectedDestination: undefined,
        selectedFlight: undefined,

        inventory: [],
        memories: [],
        achievements: [],

        flags: {},

        playTime: 0,
    };
}

/**
 * 状态管理器类
 */
export class StateManager {
    private state: GameState;
    private listeners: Set<(state: GameState) => void> = new Set();

    constructor() {
        this.state = createInitialState();
    }

    /**
     * 获取当前状态
     */
    getState(): GameState {
        return this.state;
    }

    /**
     * 获取当前存档
     */
    getSave(): GameSave | null {
        return this.state.save;
    }

    /**
     * 订阅状态变化
     */
    subscribe(listener: (state: GameState) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * 更新状态
     */
    private setState(updates: Partial<GameState>): void {
        this.state = { ...this.state, ...updates };
        this.notifyListeners();
    }

    /**
     * 更新存档
     */
    private updateSave(updates: Partial<GameSave>): void {
        if (!this.state.save) return;

        this.state = {
            ...this.state,
            save: {
                ...this.state.save,
                ...updates,
                updatedAt: new Date().toISOString(),
            },
        };
        this.notifyListeners();
    }

    /**
     * 通知所有监听器
     */
    private notifyListeners(): void {
        for (const listener of this.listeners) {
            listener(this.state);
        }
    }

    // ============================================
    // 游戏生命周期
    // ============================================

    /**
     * 开始新游戏
     */
    startNewGame(params: CreateSaveParams): void {
        const save = createNewSave(params);
        const startScene = getSceneById(save.currentSceneId);

        // 获取初始对话脚本
        const startDialogScript = getPhaseStartDialog('planning');

        // 通过 entryDialogId 或 startNodeId 找到初始对话节点
        let startDialog: DialogNode | undefined;
        if (startScene?.entryDialogId) {
            startDialog = getDialogNodeById(startScene.entryDialogId);
        } else if (startDialogScript) {
            startDialog = startDialogScript.nodes.find(n => n.id === startDialogScript.startNodeId);
        }

        console.log('[StateManager] startNewGame', {
            save,
            startScene,
            startDialogScript,
            startDialog,
        });

        this.setState({
            isLoaded: true,
            isLoading: false,
            save,
            currentScene: startScene || null,
            currentBackground: startScene?.background || null,
            showDialog: !!startDialog,
            currentDialogNode: startDialog || null,
            currentDialogScript: startDialogScript || null,
            typewriterComplete: false,
        });
    }

    /**
     * 加载存档
     */
    loadSave(save: GameSave): void {
        const scene = getSceneById(save.currentSceneId);
        const dialogNode = save.currentDialogId
            ? getDialogNodeById(save.currentDialogId)
            : null;
        const dialogScript = save.currentDialogScriptId
            ? getDialogScriptById(save.currentDialogScriptId)
            : null;

        this.setState({
            isLoaded: true,
            isLoading: false,
            save,
            currentScene: scene || null,
            currentBackground: scene?.background || null,
            showDialog: !!dialogNode,
            currentDialogNode: dialogNode,
            currentDialogScript: dialogScript,
            typewriterComplete: true,
        });
    }

    // ============================================
    // 阶段和场景
    // ============================================

    /**
     * 切换阶段
     */
    changePhase(phase: GamePhase): void {
        const startScene = getPhaseStartScene(phase);
        const startDialog = getPhaseStartDialog(phase);

        this.updateSave({
            currentPhase: phase,
            currentSceneId: startScene?.id || '',
            currentDialogId: startDialog?.startNodeId,
            currentDialogScriptId: startDialog?.id,
        });

        this.setState({
            currentScene: startScene || null,
            currentBackground: startScene?.background || null,
            showDialog: !!startDialog,
            currentDialogNode: startDialog?.nodes[0] || null,
            currentDialogScript: startDialog || null,
            typewriterComplete: false,
        });
    }

    /**
     * 切换场景
     */
    changeScene(sceneId: string): void {
        const scene = getSceneById(sceneId);
        if (!scene) return;

        const entryDialog = scene.entryDialogId
            ? getDialogNodeById(scene.entryDialogId)
            : null;

        // 找到包含这个对话节点的脚本
        let dialogScript: DialogScript | null = null;
        if (entryDialog) {
            const scripts = getDialogScriptById(scene.entryDialogId?.replace('dialog_', 'script_') || '');
            dialogScript = scripts || null;
        }

        this.updateSave({
            currentSceneId: sceneId,
            currentDialogId: entryDialog?.id,
            currentDialogScriptId: dialogScript?.id,
        });

        this.setState({
            currentScene: scene,
            currentBackground: scene.background,
            showDialog: !!entryDialog,
            currentDialogNode: entryDialog,
            currentDialogScript: dialogScript,
            typewriterComplete: false,
        });
    }

    // ============================================
    // 对话系统
    // ============================================

    /**
     * 开始对话
     */
    startDialog(scriptId: string): void {
        const script = getDialogScriptById(scriptId);
        if (!script) return;

        const startNode = script.nodes.find(n => n.id === script.startNodeId);
        if (!startNode) return;

        this.updateSave({
            currentDialogId: startNode.id,
            currentDialogScriptId: script.id,
        });

        this.setState({
            showDialog: true,
            showChoices: !!startNode.choices?.length,
            currentDialogNode: startNode,
            currentDialogScript: script,
            typewriterComplete: false,
            currentBackground: startNode.background || this.state.currentBackground,
            currentCharacterSprite: startNode.characterSprite || null,
        });
    }

    /**
     * 推进对话
     */
    advanceDialog(): DialogNode | null {
        const { currentDialogNode, currentDialogScript, typewriterComplete } = this.state;

        // 如果打字机还没完成，先完成打字机
        if (!typewriterComplete) {
            this.setState({ typewriterComplete: true });
            return currentDialogNode;
        }

        // 如果当前节点有选项，等待选择
        if (currentDialogNode?.choices?.length) {
            this.setState({ showChoices: true });
            return currentDialogNode;
        }

        // 如果有下一个节点，前进
        if (currentDialogNode?.next && currentDialogScript) {
            const nextNode = currentDialogScript.nodes.find(n => n.id === currentDialogNode.next);
            if (nextNode) {
                // 标记当前对话为已读
                if (this.state.save && !this.state.save.readDialogIds.includes(currentDialogNode.id)) {
                    this.updateSave({
                        readDialogIds: [...this.state.save.readDialogIds, currentDialogNode.id],
                        currentDialogId: nextNode.id,
                    });
                }

                this.setState({
                    currentDialogNode: nextNode,
                    showChoices: !!nextNode.choices?.length,
                    typewriterComplete: false,
                    currentBackground: nextNode.background || this.state.currentBackground,
                    currentCharacterSprite: nextNode.characterSprite || null,
                });

                return nextNode;
            }
        }

        // 对话结束
        this.endDialog();
        return null;
    }

    /**
     * 做出选择
     */
    makeChoice(choiceId: string): DialogNode | null {
        const { currentDialogNode, currentDialogScript } = this.state;
        if (!currentDialogNode?.choices || !currentDialogScript) return null;

        const choice = currentDialogNode.choices.find(c => c.id === choiceId);
        if (!choice) return null;

        // 找到选择指向的下一个节点
        const nextNode = currentDialogScript.nodes.find(n => n.id === choice.nextId);
        if (!nextNode) return null;

        this.updateSave({
            currentDialogId: nextNode.id,
            readDialogIds: [...(this.state.save?.readDialogIds || []), currentDialogNode.id],
        });

        this.setState({
            currentDialogNode: nextNode,
            showChoices: !!nextNode.choices?.length,
            typewriterComplete: false,
            currentBackground: nextNode.background || this.state.currentBackground,
            currentCharacterSprite: nextNode.characterSprite || null,
        });

        return nextNode;
    }

    /**
     * 结束对话
     */
    endDialog(): void {
        this.updateSave({
            currentDialogId: undefined,
            currentDialogScriptId: undefined,
        });

        this.setState({
            showDialog: false,
            showChoices: false,
            currentDialogNode: null,
            currentDialogScript: null,
            typewriterComplete: false,
        });
    }

    /**
     * 完成打字机效果
     */
    completeTypewriter(): void {
        this.setState({ typewriterComplete: true });
    }

    // ============================================
    // 物品和收集
    // ============================================

    /**
     * 添加物品
     */
    addItem(item: InventoryItem): void {
        if (!this.state.save) return;

        const existingItem = this.state.save.inventory.find(i => i.id === item.id);
        if (existingItem) {
            // 增加数量
            const updatedInventory = this.state.save.inventory.map(i =>
                i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
            );
            this.updateSave({ inventory: updatedInventory });
        } else {
            // 添加新物品
            this.updateSave({
                inventory: [...this.state.save.inventory, item],
            });
        }
    }

    /**
     * 移除物品
     */
    removeItem(itemId: string, quantity = 1): void {
        if (!this.state.save) return;

        const updatedInventory = this.state.save.inventory
            .map(item => {
                if (item.id === itemId) {
                    const newQuantity = item.quantity - quantity;
                    return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
                }
                return item;
            })
            .filter((item): item is InventoryItem => item !== null);

        this.updateSave({ inventory: updatedInventory });
    }

    /**
     * 添加回忆
     */
    addMemory(memory: Memory): void {
        if (!this.state.save) return;

        if (!this.state.save.memories.find(m => m.id === memory.id)) {
            this.updateSave({
                memories: [...this.state.save.memories, memory],
            });
        }
    }

    /**
     * 解锁成就
     */
    unlockAchievement(achievementId: string): void {
        if (!this.state.save) return;

        if (!this.state.save.achievements.includes(achievementId)) {
            this.updateSave({
                achievements: [...this.state.save.achievements, achievementId],
            });
        }
    }

    // ============================================
    // 标记系统
    // ============================================

    /**
     * 设置标记
     */
    setFlag(key: string, value: boolean | string | number): void {
        if (!this.state.save) return;

        this.updateSave({
            flags: {
                ...this.state.save.flags,
                [key]: value,
            },
        });
    }

    /**
     * 获取标记
     */
    getFlag<T extends boolean | string | number>(key: string): T | undefined {
        return this.state.save?.flags[key] as T | undefined;
    }

    /**
     * 检查条件
     */
    checkCondition(condition: string): boolean {
        if (!this.state.save || !condition) return true;

        // 简单的条件解析器
        // 支持: flagName, !flagName, flagName === value
        const flags = this.state.save.flags;

        // 处理 AND 条件
        const andParts = condition.split('&&').map(s => s.trim());

        for (const part of andParts) {
            // 处理 NOT
            if (part.startsWith('!')) {
                const flagName = part.substring(1).trim();
                if (flags[flagName]) return false;
                continue;
            }

            // 处理等于
            if (part.includes('===')) {
                const [flagName, value] = part.split('===').map(s => s.trim());
                const flagValue = flags[flagName];
                if (String(flagValue) !== value.replace(/['"]/g, '')) return false;
                continue;
            }

            // 简单的 truthy 检查
            if (!flags[part]) return false;
        }

        return true;
    }

    // ============================================
    // UI 状态
    // ============================================

    /**
     * 切换菜单
     */
    toggleMenu(): void {
        this.setState({ showMenu: !this.state.showMenu });
    }

    /**
     * 切换背包
     */
    toggleInventory(): void {
        this.setState({ showInventory: !this.state.showInventory });
    }

    /**
     * 切换回忆相册
     */
    toggleMemories(): void {
        this.setState({ showMemories: !this.state.showMemories });
    }
}
