/**
 * 游戏引擎 - 类型定义
 */

import type {
    GamePhase,
    GameSave,
    GameState,
    DialogNode,
    DialogScript,
    Scene,
    GameEffect,
    InventoryItem,
    Memory,
    CreateSaveParams,
} from '~/types/game';

/**
 * 游戏引擎事件类型
 */
export type GameEventType =
    | 'phase_changed'       // 阶段切换
    | 'scene_changed'       // 场景切换
    | 'dialog_started'      // 对话开始
    | 'dialog_advanced'     // 对话推进
    | 'dialog_ended'        // 对话结束
    | 'choice_made'         // 做出选择
    | 'item_added'          // 获得物品
    | 'item_removed'        // 失去物品
    | 'memory_added'        // 获得回忆
    | 'achievement_unlocked'// 解锁成就
    | 'flag_changed'        // 标记改变
    | 'save_created'        // 存档创建
    | 'save_loaded'         // 存档加载
    | 'save_updated'        // 存档更新
    | 'error';              // 错误发生

/**
 * 游戏事件
 */
export interface GameEvent<T = unknown> {
    type: GameEventType;
    payload: T;
    timestamp: number;
}

/**
 * 事件监听器
 */
export type GameEventListener<T = unknown> = (event: GameEvent<T>) => void;

/**
 * 游戏引擎动作类型
 */
export type GameAction =
    | { type: 'START_NEW_GAME'; payload: CreateSaveParams }
    | { type: 'LOAD_SAVE'; payload: string } // save id
    | { type: 'CHANGE_PHASE'; payload: GamePhase }
    | { type: 'CHANGE_SCENE'; payload: string } // scene id
    | { type: 'START_DIALOG'; payload: string } // dialog script id
    | { type: 'ADVANCE_DIALOG' }
    | { type: 'MAKE_CHOICE'; payload: string } // choice id
    | { type: 'COMPLETE_TYPEWRITER' }
    | { type: 'ADD_ITEM'; payload: InventoryItem }
    | { type: 'REMOVE_ITEM'; payload: string } // item id
    | { type: 'ADD_MEMORY'; payload: Memory }
    | { type: 'SET_FLAG'; payload: { key: string; value: boolean | string | number } }
    | { type: 'UNLOCK_ACHIEVEMENT'; payload: string } // achievement id
    | { type: 'SAVE_GAME' }
    | { type: 'TOGGLE_MENU' }
    | { type: 'TOGGLE_INVENTORY' }
    | { type: 'TOGGLE_MEMORIES' };

/**
 * 游戏引擎接口
 */
export interface IGameEngine {
    // 状态访问
    getState(): GameState;
    getSave(): GameSave | null;

    // 游戏控制
    dispatch(action: GameAction): Promise<void>;

    // 事件系统
    on<T = unknown>(event: GameEventType, listener: GameEventListener<T>): () => void;
    off<T = unknown>(event: GameEventType, listener: GameEventListener<T>): void;

    // 条件检查
    checkCondition(condition: string): boolean;

    // 效果执行
    executeEffects(effects: GameEffect[]): Promise<void>;

    // 辅助方法
    getCurrentDialogNode(): DialogNode | null;
    getCurrentScene(): Scene | null;
    getAvailableChoices(): DialogNode['choices'];
}

/**
 * 游戏引擎配置
 */
export interface GameEngineConfig {
    /** 自动保存间隔（毫秒），0 表示禁用 */
    autoSaveInterval?: number;
    /** 打字机速度（每字符毫秒） */
    typewriterSpeed?: number;
    /** 是否启用调试模式 */
    debug?: boolean;
}
