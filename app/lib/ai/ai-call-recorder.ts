/**
 * AI 调用记录器
 *
 * 提供统一的 AI 调用记录接口，用于记录所有 AI 调用的信息
 */

import type { AICallRecord, AICallType } from '../../../workers/storage/types';

// 生成唯一 ID
function generateId(prefix: string = 'call_'): string {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// 获取当前时间 ISO 字符串
function now(): string {
    return new Date().toISOString();
}

/**
 * AI 调用记录上下文
 */
export interface AICallContext {
    worldId?: string;
    projectId?: string;
    spotId?: string;
    npcId?: string;
}

/**
 * AI 调用记录器配置
 */
export interface AICallRecorderConfig {
    /** 是否启用记录 */
    enabled: boolean;
    /** 保存记录的回调函数 */
    onSave?: (record: AICallRecord) => Promise<void>;
}

// 默认配置
let recorderConfig: AICallRecorderConfig = {
    enabled: true,
    onSave: undefined,
};

/**
 * 配置 AI 调用记录器
 */
export function configureAICallRecorder(config: Partial<AICallRecorderConfig>): void {
    recorderConfig = { ...recorderConfig, ...config };
}

/**
 * 创建 AI 调用记录
 */
export function createAICallRecord(
    type: AICallType,
    prompt: string,
    context: AICallContext = {}
): AICallRecord {
    return {
        id: generateId('call_'),
        type,
        worldId: context.worldId,
        projectId: context.projectId,
        spotId: context.spotId,
        npcId: context.npcId,
        prompt,
        response: undefined,
        success: false,
        error: undefined,
        model: undefined,
        tokenUsage: undefined,
        duration: 0,
        retryCount: 0,
        createdAt: now(),
    };
}

/**
 * 完成 AI 调用记录
 */
export function completeAICallRecord(
    record: AICallRecord,
    options: {
        success: boolean;
        response?: string;
        error?: string;
        model?: string;
        tokenUsage?: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
        };
        duration: number;
        retryCount: number;
    }
): AICallRecord {
    return {
        ...record,
        success: options.success,
        response: options.response,
        error: options.error,
        model: options.model,
        tokenUsage: options.tokenUsage,
        duration: options.duration,
        retryCount: options.retryCount,
    };
}

/**
 * 保存 AI 调用记录
 */
export async function saveAICallRecord(record: AICallRecord): Promise<void> {
    if (!recorderConfig.enabled) return;

    // 打印日志
    console.log(`[AI-Call-Recorder] ${record.type} ${record.success ? '✅' : '❌'} (${record.duration}ms, retries: ${record.retryCount})`);

    // 调用保存回调
    if (recorderConfig.onSave) {
        try {
            await recorderConfig.onSave(record);
        } catch (error) {
            console.error('[AI-Call-Recorder] 保存记录失败:', error);
        }
    }
}

/**
 * AI 调用记录包装器
 * 包装一个 AI 调用函数，自动记录调用信息
 */
export async function withAICallRecording<T>(
    type: AICallType,
    prompt: string,
    context: AICallContext,
    model: string,
    fn: () => Promise<{
        success: boolean;
        data?: T;
        error?: string;
        usage?: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
        };
    }>
): Promise<{
    success: boolean;
    data?: T;
    error?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    record?: AICallRecord;
}> {
    const record = createAICallRecord(type, prompt, context);
    const startTime = Date.now();
    let retryCount = 0;

    try {
        const result = await fn();
        const duration = Date.now() - startTime;

        const completedRecord = completeAICallRecord(record, {
            success: result.success,
            response: result.data ? JSON.stringify(result.data) : undefined,
            error: result.error,
            model,
            tokenUsage: result.usage,
            duration,
            retryCount,
        });

        await saveAICallRecord(completedRecord);

        return {
            ...result,
            record: completedRecord,
        };
    } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        const completedRecord = completeAICallRecord(record, {
            success: false,
            error: errorMessage,
            model,
            duration,
            retryCount,
        });

        await saveAICallRecord(completedRecord);

        return {
            success: false,
            error: errorMessage,
            record: completedRecord,
        };
    }
}

/**
 * 导出类型以便其他模块使用
 */
export type { AICallRecord, AICallType };
