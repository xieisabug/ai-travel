/**
 * AI 内容生成抽象层 - 类型定义
 */

import type {
    Destination,
    Character,
    Scene,
    DialogNode,
    Memory,
    GamePhase,
    CharacterEmotion
} from '~/types/game';

// ============================================
// 生成提示类型
// ============================================

/**
 * 场景背景生成提示
 */
export interface ScenePrompt {
    /** 场景名称 */
    name: string;
    /** 场景描述 */
    description: string;
    /** 场景类型（如：机场、飞机内、城市街道、自然风景等） */
    type: string;
    /** 时间（如：早晨、午后、傍晚、夜晚） */
    timeOfDay?: string;
    /** 天气（如：晴朗、多云、雨天） */
    weather?: string;
    /** 风格（如：写实、动漫、水彩） */
    style?: string;
    /** 额外描述 */
    additionalDetails?: string;
}

/**
 * 角色立绘生成提示
 */
export interface CharacterPrompt {
    /** 角色名称 */
    name: string;
    /** 角色描述 */
    description: string;
    /** 表情 */
    emotion: CharacterEmotion;
    /** 服装描述 */
    outfit?: string;
    /** 风格 */
    style?: string;
}

/**
 * 目的地图片生成提示
 */
export interface DestinationPrompt {
    /** 目的地名称 */
    name: string;
    /** 目的地描述 */
    description: string;
    /** 特色标签 */
    tags?: string[];
    /** 风格 */
    style?: string;
}

/**
 * 对话生成上下文
 */
export interface DialogContext {
    /** 当前阶段 */
    phase: GamePhase;
    /** 场景描述 */
    sceneDescription: string;
    /** 说话者 */
    speaker: string;
    /** 之前的对话（用于上下文） */
    previousDialogs?: { speaker: string; text: string }[];
    /** 对话主题 */
    topic?: string;
    /** 语气（如：友好、神秘、热情） */
    tone?: string;
}

/**
 * NPC 生成上下文
 */
export interface NPCContext {
    /** 所属阶段 */
    phase: GamePhase;
    /** 场景 */
    scene: string;
    /** 角色类型（如：空姐、导游、当地居民） */
    role: string;
    /** 性格特点 */
    personality?: string;
}

// ============================================
// 生成结果类型
// ============================================

/**
 * 图片生成结果
 */
export interface GeneratedImage {
    /** 图片 URL */
    url: string;
    /** 图片宽度 */
    width?: number;
    /** 图片高度 */
    height?: number;
    /** 生成使用的提示词 */
    prompt?: string;
}

/**
 * 文本生成结果
 */
export interface GeneratedText {
    /** 生成的文本 */
    text: string;
    /** 生成使用的上下文 */
    context?: string;
}

// ============================================
// AI 内容提供者接口
// ============================================

/**
 * AI 内容提供者接口
 * 
 * 所有 AI 内容生成实现都需要实现此接口
 * 当前实现: MockAIProvider（固定数据）
 * 未来可扩展: CloudflareAIProvider, OpenAIProvider
 */
export interface IAIContentProvider {
    // ============================================
    // 图像生成
    // ============================================

    /**
     * 生成场景背景图
     * @param prompt 场景提示
     * @returns 图片 URL
     */
    generateSceneBackground(prompt: ScenePrompt): Promise<string>;

    /**
     * 生成角色立绘
     * @param prompt 角色提示
     * @returns 图片 URL
     */
    generateCharacterSprite(prompt: CharacterPrompt): Promise<string>;

    /**
     * 生成目的地封面图
     * @param prompt 目的地提示
     * @returns 图片 URL
     */
    generateDestinationImage(prompt: DestinationPrompt): Promise<string>;

    // ============================================
    // 文本生成
    // ============================================

    /**
     * 生成对话文本
     * @param context 对话上下文
     * @returns 生成的对话文本
     */
    generateDialogText(context: DialogContext): Promise<string>;

    /**
     * 生成目的地描述
     * @param destination 目的地基本信息
     * @returns 生成的描述文本
     */
    generateDestinationDescription(destination: Partial<Destination>): Promise<string>;

    /**
     * 生成旅行日记
     * @param memories 收集的回忆
     * @returns 生成的日记文本
     */
    generateTravelJournal(memories: Memory[]): Promise<string>;

    // ============================================
    // 结构化数据生成
    // ============================================

    /**
     * 生成新的目的地
     * @returns 完整的目的地数据
     */
    generateDestination(): Promise<Destination>;

    /**
     * 生成新的 NPC 角色
     * @param context NPC 上下文
     * @returns 完整的角色数据
     */
    generateNPC(context: NPCContext): Promise<Character>;

    /**
     * 生成场景
     * @param phase 所属阶段
     * @param name 场景名称
     * @returns 完整的场景数据
     */
    generateScene(phase: GamePhase, name: string): Promise<Scene>;

    /**
     * 生成对话节点
     * @param context 对话上下文
     * @returns 对话节点
     */
    generateDialogNode(context: DialogContext): Promise<DialogNode>;
}

/**
 * AI 提供者配置
 */
export interface AIProviderConfig {
    /** API 密钥（如需要） */
    apiKey?: string;
    /** API 端点（如需要） */
    endpoint?: string;
    /** 模型名称 */
    model?: string;
    /** 图片生成风格 */
    imageStyle?: string;
    /** 默认语言 */
    language?: string;
}

/**
 * AI 提供者类型
 */
export type AIProviderType = 'mock' | 'cloudflareAI' | 'openai' | 'custom';
