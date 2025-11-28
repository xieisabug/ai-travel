/**
 * AI 内容生成抽象层 - 入口文件
 * 
 * 提供统一的 AI 内容生成接口，支持多种 AI 后端
 */

export type {
    IAIContentProvider,
    AIProviderConfig,
    AIProviderType,
    ScenePrompt,
    CharacterPrompt,
    DestinationPrompt,
    DialogContext,
    NPCContext,
    GeneratedImage,
    GeneratedText,
} from './types';

export { MockAIProvider } from './mock-provider';

import type { IAIContentProvider, AIProviderType, AIProviderConfig } from './types';
import { MockAIProvider } from './mock-provider';

/**
 * 创建 AI 内容提供者实例
 * 
 * @param type AI 提供者类型
 * @param config 配置选项
 * @returns AI 内容提供者实例
 * 
 * @example
 * ```ts
 * // 使用 Mock 提供者
 * const ai = createAIProvider('mock');
 * 
 * // 使用 Cloudflare AI（需要配置）
 * const ai = createAIProvider('cloudflareAI', { 
 *   apiKey: 'xxx',
 *   model: '@cf/xxx'
 * });
 * ```
 */
export function createAIProvider(
    type: AIProviderType = 'mock',
    config: AIProviderConfig = {}
): IAIContentProvider {
    switch (type) {
        case 'mock':
            return new MockAIProvider(config);

        case 'cloudflareAI':
            // TODO: 实现 CloudflareAIProvider
            console.warn('CloudflareAI provider not implemented, falling back to mock');
            return new MockAIProvider(config);

        case 'openai':
            // TODO: 实现 OpenAIProvider
            console.warn('OpenAI provider not implemented, falling back to mock');
            return new MockAIProvider(config);

        case 'custom':
            // TODO: 实现 CustomAPIProvider
            console.warn('Custom provider not implemented, falling back to mock');
            return new MockAIProvider(config);

        default:
            return new MockAIProvider(config);
    }
}

// 默认 AI 提供者实例（单例）
let defaultAIInstance: IAIContentProvider | null = null;

/**
 * 获取默认 AI 提供者实例（单例模式）
 * 
 * @returns 默认 AI 内容提供者实例
 * 
 * @example
 * ```ts
 * const ai = getDefaultAI();
 * const background = await ai.generateSceneBackground({ ... });
 * ```
 */
export function getDefaultAI(): IAIContentProvider {
    if (!defaultAIInstance) {
        defaultAIInstance = createAIProvider('mock');
    }
    return defaultAIInstance;
}

/**
 * 设置默认 AI 提供者实例
 * 
 * @param provider AI 内容提供者实例
 * 
 * @example
 * ```ts
 * // 切换到 Cloudflare AI
 * const cfAI = createAIProvider('cloudflareAI', { apiKey: 'xxx' });
 * setDefaultAI(cfAI);
 * ```
 */
export function setDefaultAI(provider: IAIContentProvider): void {
    defaultAIInstance = provider;
}
