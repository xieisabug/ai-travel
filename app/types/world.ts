/**
 * AI 虚拟旅游 - 世界与旅游核心类型定义
 * 
 * 这个文件定义了 AI 生成的虚拟世界、旅游项目、景点、NPC 等核心数据结构
 */

// ============================================
// 世界系统
// ============================================

/**
 * 视觉风格设定
 * 确保整个世界的图片风格统一
 */
export interface WorldVisualStyle {
    /** 绘画风格 */
    artStyle: 'watercolor' | 'pixel' | 'anime' | 'realistic' | 'oil-painting' | 'sketch' | 'fantasy-illustration';
    /** 色调倾向 */
    colorPalette: 'warm' | 'cool' | 'pastel' | 'vibrant' | 'muted' | 'monochrome' | 'neon';
    /** 光影风格 */
    lighting: 'soft' | 'dramatic' | 'flat' | 'cinematic' | 'ethereal' | 'harsh';
    /** 整体氛围 */
    mood: 'mysterious' | 'cheerful' | 'melancholic' | 'epic' | 'serene' | 'whimsical' | 'dark';
    /** 风格关键词（用于图片生成） */
    styleKeywords: string[];
    /** 风格描述（自然语言，用于 prompt） */
    styleDescription: string;
}

/**
 * 虚拟世界
 * 由 AI 生成的不存在的幻想世界
 */
export interface World {
    /** 世界唯一标识 */
    id: string;
    /** 世界名称 */
    name: string;
    /** 世界副标题/别称 */
    subtitle?: string;
    /** 世界简介 */
    description: string;
    /** 世界详细描述 */
    detailedDescription: string;
    /** 封面图片 URL */
    coverImage?: string;
    /** 世界特色标签 */
    tags: string[];
    /** 视觉风格设定（确保整个世界图片风格统一） */
    visualStyle?: WorldVisualStyle;

    // === 风土人情 ===
    /** 地理特征描述 */
    geography: string;
    /** 气候特征描述 */
    climate: string;
    /** 文化特色描述 */
    culture: string;
    /** 当地居民特点 */
    inhabitants: string;
    /** 特色美食 */
    cuisine: string;
    /** 语言/交流方式 */
    language: string;
    /** 货币/交易方式 */
    currency: string;
    /** 特殊规则/禁忌 */
    rules?: string;

    // === 旅游相关 ===
    /** 最佳旅游时间 */
    bestTimeToVisit?: string;
    /** 旅行器（交通工具） */
    travelVehicle?: TravelVehicle;
    /** 可用的旅游项目 */
    travelProjects: TravelProject[];

    // === 视觉 ===
    /** 世界主图 URL */
    imageUrl?: string;
    /** 世界纪元/时代 */
    era?: string;

    // === 元数据 ===
    /** 创建时间 */
    createdAt: string;
    /** 生成状态 */
    generationStatus: WorldGenerationStatus;
}

/**
 * 世界生成状态
 */
export type WorldGenerationStatus =
    | 'generating'      // 正在生成基础描述
    | 'ready'           // 已生成，可以选择项目
    | 'projects_ready'  // 旅游项目已生成
    | 'error';          // 生成失败

// ============================================
// 旅行器系统（交通工具）
// ============================================

/**
 * 旅行器（交通工具）
 * 用于在世界中旅行的载具
 */
export interface TravelVehicle {
    /** 旅行器唯一标识 */
    id: string;
    /** 旅行器名称 */
    name: string;
    /** 旅行器类型（如：飞艇、魔法列车、巨龙等） */
    type: string;
    /** 旅行器简介 */
    description: string;
    /** 详细描述 */
    detailedDescription: string;
    /** 旅行器图片 URL */
    image?: string;

    // === 特性 ===
    /** 载客量 */
    capacity: number;
    /** 速度描述 */
    speed: string;
    /** 特殊能力/功能 */
    abilities: string[];
    /** 舒适度等级 1-5 */
    comfortLevel: number;

    // === 外观 ===
    /** 外观描述（用于生成图片） */
    appearance: string;
    /** 内部设施描述 */
    interiorDescription: string;

    // === 元数据 ===
    /** 创建时间 */
    createdAt: string;
    /** 生成状态 */
    generationStatus: VehicleGenerationStatus;
}

/**
 * 旅行器生成状态
 */
export type VehicleGenerationStatus =
    | 'pending'           // 待生成
    | 'generating_text'   // 正在生成文本
    | 'generating_image'  // 正在生成图片
    | 'ready'             // 已就绪
    | 'error';            // 生成失败

// ============================================
// 旅游项目系统
// ============================================

/**
 * 旅游项目
 * 一个可供选择的旅游行程
 */
export interface TravelProject {
    /** 项目唯一标识 */
    id: string;
    /** 项目名称 */
    name: string;
    /** 项目简介 */
    description: string;
    /** 封面图片 URL */
    coverImage?: string;
    /** 所属世界 ID */
    worldId: string;

    // === 行程信息 ===
    /** 推荐游玩天数 */
    duration: number;
    /** 难度等级 1-5 */
    difficulty: number;
    /** 特色标签 */
    tags: string[];
    /** 适合人群描述 */
    suitableFor: string;

    // === 景点和动线 ===
    /** 景点列表 */
    spots: Spot[];
    /** 游览动线（景点ID顺序） */
    tourRoute: string[];

    // === 状态 ===
    /** 项目生成状态 */
    generationStatus: ProjectGenerationStatus;
    /** 状态别名 (同 generationStatus) */
    status?: ProjectGenerationStatus;
    /** 已选择此项目的玩家数量（用于触发生成） */
    selectedCount: number;
    /** 项目开放时间（用于启程CD） */
    availableAt?: string;

    // === 描述 ===
    /** 简短概述 */
    telesummary?: string;
    /** 预估时长 */
    estimatedDuration?: {
        departure: number;  // 启程准备时间（小时）
        traveling: number;  // 游览时间（小时）
    };

    // === 元数据 ===
    /** 创建时间 */
    createdAt: string;
    /** 详情生成完成时间 */
    detailsGeneratedAt?: string;
}

/**
 * 项目生成状态
 */
export type ProjectGenerationStatus =
    | 'pending'             // 待生成（需要有人选择才开始）
    | 'generating_details'  // 正在生成详情（景点、NPC、故事）
    | 'generating_images'   // 正在生成图片
    | 'ready'               // 已就绪，可以开始旅游
    | 'error';              // 生成失败

// ============================================
// 景点系统
// ============================================

/**
 * 景点
 */
export interface Spot {
    /** 景点唯一标识 */
    id: string;
    /** 景点名称 */
    name: string;
    /** 景点简介 */
    description: string;
    /** 景点详细描述 */
    detailedDescription: string;
    /** 景点图片 URL */
    image?: string;
    /** 所属项目 ID */
    projectId: string;

    // === 故事和背景 ===
    /** 景点历史/传说故事 */
    story: string;
    /** 景点特色/亮点 */
    highlights: string[];
    /** 参观建议 */
    visitTips?: string;

    // === NPC ===
    /** 该景点的 NPC 列表 */
    npcs: SpotNPC[];

    // === 交互 ===
    /** 可交互热点 */
    hotspots: SpotHotspot[];
    /** 入口对话脚本 ID */
    entryDialogId?: string;

    // === 游览相关 ===
    /** 建议游览时长（分钟） */
    suggestedDuration: number;
    /** 在动线中的顺序 */
    orderInRoute: number;

    // === 元数据 ===
    /** 生成状态 */
    generationStatus: SpotGenerationStatus;
}

/**
 * 景点生成状态
 */
export type SpotGenerationStatus =
    | 'pending'           // 待生成
    | 'generating_text'   // 正在生成文本描述
    | 'generating_image'  // 正在生成图片
    | 'ready'             // 已就绪
    | 'error';            // 生成失败

/**
 * 景点热点
 */
export interface SpotHotspot {
    /** 热点 ID */
    id: string;
    /** 热点名称 */
    name: string;
    /** 热点描述 */
    description: string;
    /** X 位置 (0-100%) */
    x: number;
    /** Y 位置 (0-100%) */
    y: number;
    /** 交互类型 */
    type: 'dialog' | 'photo' | 'item' | 'story';
    /** 目标 ID（对话/物品等） */
    targetId?: string;
}

// ============================================
// NPC 系统
// ============================================

/**
 * 景点 NPC
 */
export interface SpotNPC {
    /** NPC 唯一标识 */
    id: string;
    /** NPC 名称 */
    name: string;
    /** NPC 角色（如：导游、店主、居民等） */
    role: string;
    /** NPC 简介 */
    description: string;

    // === 背景和性格 ===
    /** 背景故事 */
    backstory: string;
    /** 性格特点 */
    personality: string[];
    /** 外貌描述 */
    appearance: string;
    /** 说话风格 */
    speakingStyle: string;
    /** 兴趣爱好 */
    interests?: string[];

    // === 立绘 ===
    /** 默认立绘 URL */
    sprite?: string;
    /** 各表情立绘 */
    sprites?: Record<NPCEmotion, string>;

    // === 对话 ===
    /** 初次见面对话 */
    greetingDialogId?: string;
    /** 可选对话列表 */
    dialogOptions?: NPCDialogOption[];

    // === 元数据 ===
    /** 生成状态 */
    generationStatus: NPCGenerationStatus;
}

/**
 * NPC 表情
 */
export type NPCEmotion =
    | 'neutral'
    | 'happy'
    | 'sad'
    | 'surprised'
    | 'angry'
    | 'thinking';

/**
 * NPC 对话选项
 */
export interface NPCDialogOption {
    /** 选项 ID */
    id: string;
    /** 选项文本 */
    text: string;
    /** 对话脚本 ID */
    dialogId: string;
    /** 显示条件 */
    condition?: string;
}

// ============================================
// 对话脚本系统
// ============================================

/**
 * 对话脚本类型
 */
export type DialogScriptType =
    | 'entry'      // 入场对话（玩家进入景点时）
    | 'chat'       // 闲聊对话
    | 'quest'      // 任务对话
    | 'shop'       // 商店对话
    | 'farewell';  // 告别对话

/**
 * 对话脚本（预生成并存储在数据库中）
 */
export interface DialogScript {
    /** 脚本 ID */
    id: string;
    /** 所属 NPC ID */
    npcId: string;
    /** 所属景点 ID */
    spotId: string;
    /** 对话类型 */
    type: DialogScriptType;
    /** 对话行列表 */
    lines: DialogLine[];
    /** 触发条件（可选） */
    condition?: string;
    /** 排序顺序（同类型多个脚本时） */
    order: number;
    /** 是否启用 */
    isActive: boolean;
    /** 创建时间 */
    createdAt: string;
    /** 更新时间 */
    updatedAt: string;
}

/**
 * 对话行
 */
export interface DialogLine {
    /** 说话者名称 */
    speaker: string;
    /** 对话文本 */
    text: string;
    /** 表情 */
    emotion?: NPCEmotion;
}

/**
 * NPC 生成状态
 */
export type NPCGenerationStatus =
    | 'pending'           // 待生成
    | 'generating_text'   // 正在生成文本
    | 'generating_sprite' // 正在生成立绘
    | 'ready'             // 已就绪
    | 'error';            // 生成失败

/**
 * NPC 公开资料（返回给前端，不含敏感数据）
 * 不包含：personality, backstory, speakingStyle, interests
 */
export interface NPCPublicProfile {
    /** NPC 唯一标识 */
    id: string;
    /** NPC 名称 */
    name: string;
    /** NPC 角色（如：导游、店主、居民等） */
    role: string;
    /** NPC 简介 */
    description: string;
    /** 外貌描述 */
    appearance: string;
    /** 默认立绘 URL */
    sprite?: string;
    /** 各表情立绘 */
    sprites?: Record<NPCEmotion, string>;
    /** 生成状态 */
    generationStatus: NPCGenerationStatus;
}

/**
 * 将 SpotNPC 转换为 NPCPublicProfile（过滤敏感数据）
 */
export function toNPCPublicProfile(npc: SpotNPC): NPCPublicProfile {
    return {
        id: npc.id,
        name: npc.name,
        role: npc.role,
        description: npc.description,
        appearance: npc.appearance,
        sprite: npc.sprite,
        sprites: npc.sprites,
        generationStatus: npc.generationStatus,
    };
}

// ============================================
// 玩家旅游状态
// ============================================

/**
 * 玩家的旅游会话状态
 */
export interface TravelSession {
    /** 会话 ID */
    id: string;
    /** 玩家 ID */
    playerId: string;
    /** 选择的世界 ID */
    worldId: string;
    /** 选择的项目 ID */
    projectId: string;

    // === 进度 ===
    /** 当前状态 */
    status: TravelSessionStatus;
    /** 当前所在景点 ID */
    currentSpotId?: string;
    /** 已访问的景点 ID 列表 */
    visitedSpots: string[];
    /** 当前动线进度 (0-100%) */
    progress: number;

    // === 时间 ===
    /** 出发时间 */
    departureTime: string;
    /** 预计返回时间 */
    estimatedReturnTime: string;
    /** 实际返回时间 */
    actualReturnTime?: string;

    // === 收集 ===
    /** 收集的照片/回忆 */
    memories: TravelMemory[];
    /** 获得的物品 */
    items: TravelItem[];

    // === 元数据 ===
    createdAt: string;
    updatedAt: string;
}

/**
 * 旅游会话状态
 */
export type TravelSessionStatus =
    | 'preparing'    // 准备中（等待生成完成）
    | 'departing'    // 启程中（等待启程时间）
    | 'traveling'    // 旅途中
    | 'exploring'    // 探索目的地中
    | 'returning'    // 返程中
    | 'completed'    // 已完成
    | 'cooldown';    // 冷却中（防止频繁旅游）

/**
 * 旅行回忆
 */
export interface TravelMemory {
    id: string;
    spotId: string;
    title: string;
    description: string;
    image?: string;
    capturedAt: string;
}

/**
 * 旅行获得的物品
 */
export interface TravelItem {
    id: string;
    name: string;
    description: string;
    icon?: string;
    spotId: string;
    acquiredAt: string;
}

// ============================================
// 生成请求/响应类型
// ============================================

/**
 * 世界生成请求
 */
export interface GenerateWorldRequest {
    /** 可选的主题/风格提示 */
    theme?: string;
    /** 可选的标签过滤 */
    tags?: string[];
}

/**
 * 项目详情生成请求
 */
export interface GenerateProjectDetailsRequest {
    /** 项目 ID */
    projectId: string;
    /** 要生成的景点数量 */
    spotCount?: number;
}

/**
 * 生成任务状态
 */
export interface GenerationTask {
    id: string;
    type: 'world' | 'project' | 'spot' | 'npc' | 'image';
    targetId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    error?: string;
    createdAt: string;
    completedAt?: string;
}
