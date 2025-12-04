/**
 * AI 内容生成抽象层 - 类型定义
 */

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
