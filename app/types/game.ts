/**
 * AI 虚拟旅游游戏 - 核心类型定义
 * 
 * 这个文件定义了游戏的所有核心数据结构，
 * 设计时考虑了后续 AI 生成数据的兼容性。
 */

// ============================================
// 游戏阶段
// ============================================

/**
 * 游戏的7个核心阶段
 */
export type GamePhase =
    | 'planning'     // 规划行程 - 选择目的地
    | 'booking'      // 购买机票 - 选择航班和座位
    | 'departure'    // 出发日 - 收拾行李、前往机场
    | 'traveling'    // 旅途中 - 飞行体验
    | 'destination'  // 目的地探索 - 游览景点
    | 'return'       // 返程 - 告别、购买纪念品
    | 'home';        // 归家总结 - 回顾旅程

/**
 * 阶段信息
 */
export interface PhaseInfo {
    id: GamePhase;
    name: string;
    description: string;
    order: number;
}

/**
 * 阶段配置映射
 */
export const PHASE_CONFIG: Record<GamePhase, PhaseInfo> = {
    planning: {
        id: 'planning',
        name: '规划行程',
        description: '浏览虚拟目的地，选择你想去的地方',
        order: 1,
    },
    booking: {
        id: 'booking',
        name: '购买机票',
        description: '选择航班和座位，完成购票流程',
        order: 2,
    },
    departure: {
        id: 'departure',
        name: '出发日',
        description: '收拾行李，前往机场，办理登机',
        order: 3,
    },
    traveling: {
        id: 'traveling',
        name: '旅途中',
        description: '享受飞行，与邻座交流，俯瞰云海',
        order: 4,
    },
    destination: {
        id: 'destination',
        name: '目的地探索',
        description: '游览景点，与当地人交流，收集回忆',
        order: 5,
    },
    return: {
        id: 'return',
        name: '返程',
        description: '告别目的地，购买纪念品，踏上归途',
        order: 6,
    },
    home: {
        id: 'home',
        name: '归家',
        description: '回顾旅程，整理照片，生成旅行日记',
        order: 7,
    },
};

// ============================================
// 角色系统
// ============================================

/**
 * 角色表情类型
 */
export type CharacterEmotion =
    | 'neutral'    // 平静
    | 'happy'      // 开心
    | 'sad'        // 悲伤
    | 'surprised'  // 惊讶
    | 'angry'      // 生气
    | 'thinking'   // 思考
    | 'excited';   // 兴奋

/**
 * 角色类型
 */
export type CharacterType =
    | 'narrator'   // 旁白
    | 'player'     // 玩家
    | 'npc';       // NPC

/**
 * 角色定义
 */
export interface Character {
    id: string;
    name: string;
    type: CharacterType;
    description: string;
    /** 角色立绘 URL 映射（按表情） */
    sprites: Partial<Record<CharacterEmotion, string>>;
    /** 默认立绘 */
    defaultSprite?: string;
    /** 角色颜色（用于对话框名称显示） */
    color?: string;
}

// ============================================
// 对话系统
// ============================================

/**
 * 游戏效果类型
 */
export type GameEffectType =
    | 'set_flag'       // 设置标记
    | 'add_item'       // 添加物品
    | 'remove_item'    // 移除物品
    | 'add_memory'     // 添加回忆
    | 'unlock_achievement' // 解锁成就
    | 'change_scene'   // 切换场景
    | 'change_phase'   // 切换阶段
    | 'play_sound'     // 播放音效（预留）
    | 'shake_screen';  // 屏幕震动（预留）

/**
 * 游戏效果
 */
export interface GameEffect {
    type: GameEffectType;
    /** 效果参数 */
    payload: Record<string, unknown>;
}

/**
 * 对话选项
 */
export interface DialogChoice {
    id: string;
    /** 选项显示文本 */
    text: string;
    /** 跳转到的对话节点 ID */
    nextId: string;
    /** 显示条件（flag 表达式，如 "hasTicket && !usedTicket"） */
    condition?: string;
    /** 选择此选项后触发的效果 */
    effects?: GameEffect[];
}

/**
 * 对话节点
 */
export interface DialogNode {
    id: string;
    /** 说话者：narrator=旁白，player=玩家，其他为角色 ID */
    speaker: 'narrator' | 'player' | string;
    /** 对话文本（支持简单变量替换如 {playerName}） */
    text: string;
    /** 角色表情 */
    emotion?: CharacterEmotion;
    /** 背景图 URL（如果需要切换背景） */
    background?: string;
    /** 角色立绘 URL（覆盖默认） */
    characterSprite?: string;
    /** 对话选项（有选项时无 next） */
    choices?: DialogChoice[];
    /** 下一个对话节点 ID（无选项时使用） */
    next?: string | null;
    /** 触发的游戏效果 */
    effects?: GameEffect[];
    /** 是否自动继续（用于连续动画/效果） */
    autoAdvance?: boolean;
    /** 自动继续延迟（毫秒） */
    autoAdvanceDelay?: number;
}

/**
 * 对话脚本（一组相关对话）
 */
export interface DialogScript {
    id: string;
    phase: GamePhase;
    /** 脚本标题（用于调试/编辑） */
    title: string;
    /** 起始节点 ID */
    startNodeId: string;
    /** 所有对话节点 */
    nodes: DialogNode[];
}

// ============================================
// 场景系统
// ============================================

/**
 * 热点类型
 */
export type HotspotType =
    | 'dialog'   // 触发对话
    | 'scene'    // 切换场景
    | 'item'     // 拾取物品
    | 'action';  // 特殊动作

/**
 * 可交互热点
 */
export interface Hotspot {
    id: string;
    /** 位置 X（百分比 0-100） */
    x: number;
    /** 位置 Y（百分比 0-100） */
    y: number;
    /** 宽度（百分比） */
    width: number;
    /** 高度（百分比） */
    height: number;
    /** 显示标签 */
    label: string;
    /** 图标（可选，用于渲染） */
    icon?: string;
    /** 热点类型 */
    type: HotspotType;
    /** 目标 ID（对话/场景/物品 ID） */
    targetId: string;
    /** 显示条件 */
    condition?: string;
    /** 是否高亮提示 */
    highlighted?: boolean;
}

/**
 * 场景定义
 */
export interface Scene {
    id: string;
    /** 所属阶段 */
    phase: GamePhase;
    /** 场景名称 */
    name: string;
    /** 场景描述 */
    description: string;
    /** 背景图 URL */
    background: string;
    /** 可交互热点 */
    hotspots: Hotspot[];
    /** 进入场景时触发的对话 ID */
    entryDialogId?: string;
    /** 背景音乐（预留） */
    bgm?: string;
    /** 环境音效（预留） */
    ambientSound?: string;
}

// ============================================
// 目的地和航班
// ============================================

/**
 * 景点
 */
export interface Attraction {
    id: string;
    name: string;
    description: string;
    /** 景点图片 URL */
    image: string;
    /** 关联的场景 ID */
    sceneId: string;
}

/**
 * 目的地
 */
export interface Destination {
    id: string;
    name: string;
    /** 副标题（如 "梦幻之城"） */
    subtitle?: string;
    description: string;
    /** 封面图 URL */
    coverImage: string;
    /** 国家/地区 */
    country: string;
    /** 气候描述 */
    climate?: string;
    /** 推荐游玩天数 */
    recommendedDays?: number;
    /** 景点列表 */
    attractions: Attraction[];
    /** 特色标签 */
    tags?: string[];
}

/**
 * 座位类型
 */
export type SeatClass = 'economy' | 'business' | 'first';

/**
 * 座位位置偏好
 */
export type SeatPosition = 'window' | 'middle' | 'aisle';

/**
 * 航班信息
 */
export interface Flight {
    id: string;
    /** 航班号 */
    flightNumber: string;
    /** 航空公司 */
    airline: string;
    /** 出发城市 */
    departureCity: string;
    /** 到达城市 */
    arrivalCity: string;
    /** 出发时间 */
    departureTime: string;
    /** 到达时间 */
    arrivalTime: string;
    /** 飞行时长（分钟） */
    duration: number;
    /** 价格（虚拟货币） */
    price: number;
    /** 舱位 */
    seatClass: SeatClass;
    /** 座位号 */
    seatNumber?: string;
}

// ============================================
// 物品和收集系统
// ============================================

/**
 * 物品类型
 */
export type ItemType =
    | 'ticket'      // 机票
    | 'souvenir'    // 纪念品
    | 'photo'       // 照片
    | 'document'    // 证件
    | 'consumable'  // 消耗品
    | 'key_item';   // 关键物品

/**
 * 物品
 */
export interface InventoryItem {
    id: string;
    name: string;
    description: string;
    type: ItemType;
    /** 物品图标 URL */
    icon: string;
    /** 数量 */
    quantity: number;
    /** 是否可使用 */
    usable?: boolean;
    /** 使用时触发的效果 */
    useEffects?: GameEffect[];
}

/**
 * 回忆（收集的照片/经历）
 */
export interface Memory {
    id: string;
    /** 标题 */
    title: string;
    /** 描述 */
    description: string;
    /** 照片 URL */
    image: string;
    /** 获取时间 */
    acquiredAt: string;
    /** 获取地点（场景 ID） */
    sceneId: string;
    /** 所属阶段 */
    phase: GamePhase;
}

/**
 * 成就
 */
export interface Achievement {
    id: string;
    name: string;
    description: string;
    /** 图标 URL */
    icon: string;
    /** 是否隐藏（未解锁时不显示） */
    hidden?: boolean;
    /** 解锁条件描述 */
    unlockHint?: string;
}

// ============================================
// 游戏存档
// ============================================

/**
 * 玩家信息
 */
export interface PlayerInfo {
    name: string;
    avatar?: string;
}

/**
 * 游戏存档
 */
export interface GameSave {
    /** 存档唯一 ID */
    id: string;
    /** 存档版本号（用于迁移） */
    version: number;
    /** 创建时间 */
    createdAt: string;
    /** 最后更新时间 */
    updatedAt: string;
    /** 存档名称（可自定义） */
    name?: string;
    /** 存档缩略图 */
    thumbnail?: string;

    // === 玩家信息 ===
    player: PlayerInfo;

    // === 游戏进度 ===
    /** 当前阶段 */
    currentPhase: GamePhase;
    /** 当前场景 ID */
    currentSceneId: string;
    /** 当前对话 ID（如果在对话中） */
    currentDialogId?: string;
    /** 当前对话脚本 ID */
    currentDialogScriptId?: string;
    /** 已读对话节点 ID 列表 */
    readDialogIds: string[];

    // === 玩家选择 ===
    /** 选择的目的地 */
    selectedDestination?: Destination;
    /** 选择的航班 */
    selectedFlight?: Flight;

    // === 收集系统 ===
    /** 背包物品 */
    inventory: InventoryItem[];
    /** 收集的回忆 */
    memories: Memory[];
    /** 解锁的成就 ID 列表 */
    achievements: string[];

    // === 游戏状态标记 ===
    /** 各种游戏标记（用于条件判断） */
    flags: Record<string, boolean | string | number>;

    // === 统计数据 ===
    /** 游戏时长（秒） */
    playTime: number;
}

// ============================================
// 游戏状态（运行时）
// ============================================

/**
 * 游戏运行时状态
 */
export interface GameState {
    /** 是否已加载 */
    isLoaded: boolean;
    /** 是否正在加载 */
    isLoading: boolean;
    /** 当前存档 */
    save: GameSave | null;

    // === UI 状态 ===
    /** 是否显示对话框 */
    showDialog: boolean;
    /** 是否显示选项菜单 */
    showChoices: boolean;
    /** 是否显示菜单 */
    showMenu: boolean;
    /** 是否显示背包 */
    showInventory: boolean;
    /** 是否显示回忆相册 */
    showMemories: boolean;

    // === 对话状态 ===
    /** 当前对话节点 */
    currentDialogNode: DialogNode | null;
    /** 当前对话脚本 */
    currentDialogScript: DialogScript | null;
    /** 打字机是否完成 */
    typewriterComplete: boolean;

    // === 场景状态 ===
    /** 当前场景 */
    currentScene: Scene | null;
    /** 当前背景图 */
    currentBackground: string | null;
    /** 当前角色立绘 */
    currentCharacterSprite: string | null;
}

// ============================================
// 工具类型
// ============================================

/**
 * 创建新存档的参数
 */
export interface CreateSaveParams {
    playerName: string;
    playerAvatar?: string;
}

/**
 * 条件表达式上下文
 */
export interface ConditionContext {
    flags: Record<string, boolean | string | number>;
    inventory: InventoryItem[];
    achievements: string[];
    currentPhase: GamePhase;
}
