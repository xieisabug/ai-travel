/**
 * 图片生成服务 - 封装层
 *
 * 提供统一的 image_generate 接口
 * 底层实现留空，由用户自行填充
 */

import type { WorldVisualStyle } from '~/types/world';
import {
    createAICallRecord,
    completeAICallRecord,
    saveAICallRecord,
    type AICallContext,
    type AICallType,
} from './ai-call-recorder';

// ============================================
// 配置类型
// ============================================

export interface ImageGenerateConfig {
    /** API Key（如需要） */
    apiKey?: string;
    /** API 端点 */
    endpoint?: string;
    /** 默认图片宽度 */
    defaultWidth?: number;
    /** 默认图片高度 */
    defaultHeight?: number;
    /** 默认风格 */
    defaultStyle?: string;
}

export interface ImageGenerateOptions {
    /** 图片宽度 */
    width?: number;
    /** 图片高度 */
    height?: number;
    /** 风格 */
    style?: 'realistic' | 'anime' | 'watercolor' | 'fantasy' | 'pixel';
    /** 负面提示词 */
    negativePrompt?: string;
    /** 超时时间（毫秒） */
    timeout?: number;
}

// ============================================
// 结果类型
// ============================================

export interface ImageGenerateResult {
    success: boolean;
    /** 生成的图片 URL */
    url?: string;
    /** 图片二进制数据 */
    data?: ArrayBuffer;
    /** 错误信息 */
    error?: string;
    /** 使用的提示词 */
    prompt?: string;
    /** 生成耗时（毫秒） */
    duration?: number;
}

// ============================================
// 提示词生成辅助函数
// ============================================

/**
 * 构建视觉风格的 prompt 片段
 */
function buildVisualStylePrompt(visualStyle?: WorldVisualStyle): string {
    if (!visualStyle) {
        return 'Style: epic fantasy art, cinematic lighting, detailed environment.';
    }

    const artStyleMap: Record<string, string> = {
        'watercolor': 'watercolor painting style, soft edges, flowing colors',
        'pixel': '8-bit pixel art style, retro gaming aesthetic',
        'anime': 'anime/manga art style, cel-shaded, vibrant',
        'realistic': 'photorealistic, highly detailed, lifelike',
        'oil-painting': 'oil painting style, rich textures, classical art',
        'sketch': 'pencil sketch style, hand-drawn, artistic lines',
        'fantasy-illustration': 'fantasy illustration style, detailed, epic composition',
    };

    const colorPaletteMap: Record<string, string> = {
        'warm': 'warm color palette with oranges, reds, and yellows',
        'cool': 'cool color palette with blues, greens, and purples',
        'pastel': 'soft pastel colors, gentle and dreamy',
        'vibrant': 'vibrant and saturated colors, eye-catching',
        'muted': 'muted and desaturated colors, subtle tones',
        'monochrome': 'monochromatic color scheme',
        'neon': 'neon colors, glowing, cyberpunk aesthetic',
    };

    const lightingMap: Record<string, string> = {
        'soft': 'soft diffused lighting',
        'dramatic': 'dramatic lighting with strong shadows',
        'flat': 'flat lighting, even illumination',
        'cinematic': 'cinematic lighting, movie-like atmosphere',
        'ethereal': 'ethereal glowing light, magical atmosphere',
        'harsh': 'harsh directional lighting',
    };

    const moodMap: Record<string, string> = {
        'mysterious': 'mysterious and enigmatic atmosphere',
        'cheerful': 'cheerful and bright mood',
        'melancholic': 'melancholic and wistful feeling',
        'epic': 'epic and grandiose scale',
        'serene': 'serene and peaceful atmosphere',
        'whimsical': 'whimsical and playful mood',
        'dark': 'dark and moody atmosphere',
    };

    const styleParts = [
        `Art style: ${artStyleMap[visualStyle.artStyle] || visualStyle.artStyle}`,
        colorPaletteMap[visualStyle.colorPalette] || visualStyle.colorPalette,
        lightingMap[visualStyle.lighting] || visualStyle.lighting,
        moodMap[visualStyle.mood] || visualStyle.mood,
    ];

    if (visualStyle.styleKeywords?.length > 0) {
        styleParts.push(`Keywords: ${visualStyle.styleKeywords.join(', ')}`);
    }

    if (visualStyle.styleDescription) {
        styleParts.push(visualStyle.styleDescription);
    }

    return styleParts.join('. ') + '.';
}

/**
 * 生成世界封面图的提示词
 */
export function buildWorldCoverPrompt(world: {
    name: string;
    description: string;
    geography: string;
    tags: string[];
    visualStyle?: WorldVisualStyle;
}): string {
    const stylePrompt = buildVisualStylePrompt(world.visualStyle);

    return `A stunning fantasy world landscape, ${world.name}, ${world.description}.
Geography features: ${world.geography}.
${stylePrompt}
Tags: ${world.tags.join(', ')}.
High quality, 8K resolution.`;
}

/**
 * 生成景点图片的提示词
 */
export function buildSpotImagePrompt(spot: {
    name: string;
    description: string;
    highlights: string[];
}, worldName: string, visualStyle?: WorldVisualStyle): string {
    const stylePrompt = buildVisualStylePrompt(visualStyle);

    return `A beautiful scenic view of ${spot.name} in the fantasy world of ${worldName}.
Description: ${spot.description}
Features: ${spot.highlights.join(', ')}.
${stylePrompt}
High quality, panoramic view.`;
}

/**
 * 生成 NPC 立绘的提示词
 */
export function buildNPCPortraitPrompt(npc: {
    name: string;
    role: string;
    appearance: string;
    personality: string[];
}, emotion: string = 'neutral', visualStyle?: WorldVisualStyle): string {
    const emotionMap: Record<string, string> = {
        neutral: 'calm and composed expression',
        happy: 'bright smile and joyful expression',
        sad: 'melancholic and wistful expression',
        surprised: 'wide-eyed surprised expression',
        angry: 'fierce and determined expression',
        thinking: 'thoughtful and contemplative expression',
    };

    // NPC 立绘默认使用 anime 风格，但可以根据世界视觉风格调整
    let stylePrompt = 'Style: anime/game character art, detailed, vibrant.';
    if (visualStyle) {
        const artStyleForCharacter = visualStyle.artStyle === 'pixel'
            ? '8-bit pixel art character'
            : visualStyle.artStyle === 'watercolor'
            ? 'watercolor character illustration'
            : visualStyle.artStyle === 'sketch'
            ? 'pencil sketch character portrait'
            : 'anime/game character art';

        stylePrompt = `Style: ${artStyleForCharacter}, ${visualStyle.colorPalette} colors, ${visualStyle.mood} mood.`;
    }

    return `A fantasy character portrait of ${npc.name}, a ${npc.role}.
Appearance: ${npc.appearance}
Expression: ${emotionMap[emotion] || emotionMap.neutral}
Personality traits visible: ${npc.personality.join(', ')}.
${stylePrompt}
Upper body portrait, facing slightly to the side.
Clean background, suitable for visual novel.`;
}

/**
 * 生成项目封面图的提示词
 */
export function buildProjectCoverPrompt(project: {
    name: string;
    description: string;
    tags: string[];
}, worldName: string, visualStyle?: WorldVisualStyle): string {
    const stylePrompt = buildVisualStylePrompt(visualStyle);

    return `A captivating travel destination poster for ${project.name} in ${worldName}.
Description: ${project.description}
Theme: ${project.tags.join(', ')}.
${stylePrompt}
High quality illustration.`;
}

/**
 * 生成旅行器图片的提示词
 */
export function buildTravelVehiclePrompt(vehicle: {
    name: string;
    type: string;
    appearance: string;
    abilities: string[];
}, worldName: string, visualStyle?: WorldVisualStyle): string {
    const stylePrompt = buildVisualStylePrompt(visualStyle);

    return `A magnificent ${vehicle.type} named ${vehicle.name} in the fantasy world of ${worldName}.
Appearance: ${vehicle.appearance}
Special abilities: ${vehicle.abilities.join(', ')}.
${stylePrompt}
Show the vehicle in its full glory, suitable for traveling through fantastical landscapes.
High quality, 8K resolution.`;
}

// ============================================
// 日志工具
// ============================================

const imageLogger = {
    prompt: (label: string, prompt: string) => {
        console.log(`\n[Image-Generate] ========== ${label} - PROMPT ==========`);
        console.log(prompt);
        console.log(`[Image-Generate] ========== END PROMPT ==========\n`);
    },
};

// ============================================
// 占位图生成（用于开发阶段）
// ============================================

const PLACEHOLDER_SERVICE = 'https://placehold.co';

/**
 * 生成占位图 URL
 */
export function getPlaceholderImage(
    width: number,
    height: number,
    text: string,
    bgColor: string = '1a1a2e',
    textColor: string = 'ffffff'
): string {
    const encodedText = encodeURIComponent(text.replace(/\n/g, '\\n'));
    return `${PLACEHOLDER_SERVICE}/${width}x${height}/${bgColor}/${textColor}?text=${encodedText}`;
}

// ============================================
// 图片生成主函数 - 留空实现
// ============================================

/**
 * 生成图片
 *
 * @param prompt 图片生成提示词
 * @param config 配置
 * @param options 选项
 * @param logLabel 日志标签
 * @returns 生成结果
 *
 * @example
 * ```ts
 * const result = await image_generate(
 *   buildWorldCoverPrompt(world),
 *   { apiKey: 'xxx' },
 *   { width: 1920, height: 1080 }
 * );
 *
 * if (result.success) {
 *   console.log('Generated image URL:', result.url);
 * }
 * ```
 */
export async function image_generate(
    prompt: string,
    config: ImageGenerateConfig,
    options: ImageGenerateOptions = {},
    logLabel: string = '图片生成',
    callType: AICallType = 'image_world_cover',
    callContext: AICallContext = {}
): Promise<ImageGenerateResult> {
    const startTime = Date.now();
    const { width = 1024, height = 768, style = 'fantasy' } = options;

    // 打印图片生成 prompt
    imageLogger.prompt(logLabel, prompt);

    // 创建 AI 调用记录
    const record = createAICallRecord(callType, prompt, callContext);

    // ========================================
    // TODO: 在这里实现实际的图片生成逻辑
    //
    // 可选的实现方式：
    // 1. Cloudflare Workers AI - 使用 @cf/stabilityai/stable-diffusion-xl-base-1.0
    // 2. OpenAI DALL-E 3
    // 3. Midjourney API
    // 4. Stable Diffusion API
    // 5. 其他图片生成服务
    //
    // 示例实现（使用 Cloudflare Workers AI）:
    //
    // const response = await env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
    //     prompt: prompt,
    //     width: width,
    //     height: height,
    // });
    //
    // // 将图片保存到 R2
    // const imageKey = `images/${Date.now()}.png`;
    // await env.BUCKET.put(imageKey, response);
    //
    // return {
    //     success: true,
    //     url: `${config.cdnBaseUrl}/${imageKey}`,
    //     prompt,
    //     duration: Date.now() - startTime,
    // };
    // ========================================

    // 当前返回占位图（开发阶段）
    const placeholderText = prompt.slice(0, 30).replace(/[^\w\s]/g, '');
    const url = getPlaceholderImage(width, height, placeholderText);
    const duration = Date.now() - startTime;

    // 保存成功记录
    const completedRecord = completeAICallRecord(record, {
        success: true,
        response: url,
        model: 'placeholder',
        duration,
        retryCount: 0,
    });
    await saveAICallRecord(completedRecord);

    return {
        success: true,
        url,
        prompt,
        duration,
    };
}

// ============================================
// 批量生成函数
// ============================================

/**
 * 并发生成多张图片
 *
 * @param prompts 提示词数组
 * @param config 配置
 * @param options 选项
 * @param logLabel 日志标签前缀
 * @returns 生成结果数组
 */
export async function image_generate_batch(
    prompts: string[],
    config: ImageGenerateConfig,
    options: ImageGenerateOptions = {},
    logLabel: string = '批量图片'
): Promise<ImageGenerateResult[]> {
    // 并发执行所有生成任务
    const results = await Promise.all(
        prompts.map((prompt, index) => image_generate(prompt, config, options, `${logLabel}-${index + 1}`))
    );

    return results;
}

// ============================================
// 特化生成函数
// ============================================

/**
 * 生成世界封面图
 */
export async function image_generate_world_cover(
    world: Parameters<typeof buildWorldCoverPrompt>[0] & { id?: string },
    config: ImageGenerateConfig,
    options?: ImageGenerateOptions
): Promise<ImageGenerateResult> {
    const prompt = buildWorldCoverPrompt(world);
    return image_generate(prompt, config, {
        width: 1920,
        height: 1080,
        style: 'fantasy',
        ...options,
    }, `世界封面-${world.name}`, 'image_world_cover', { worldId: world.id });
}

/**
 * 生成景点图片
 */
export async function image_generate_spot(
    spot: Parameters<typeof buildSpotImagePrompt>[0] & { id?: string },
    worldName: string,
    config: ImageGenerateConfig,
    options?: ImageGenerateOptions,
    context?: { worldId?: string; projectId?: string },
    visualStyle?: WorldVisualStyle
): Promise<ImageGenerateResult> {
    const prompt = buildSpotImagePrompt(spot, worldName, visualStyle);
    return image_generate(prompt, config, {
        width: 1600,
        height: 900,
        style: 'fantasy',
        ...options,
    }, `景点图片-${spot.name}`, 'image_spot', { ...context, spotId: spot.id });
}

/**
 * 生成 NPC 立绘
 */
export async function image_generate_npc_portrait(
    npc: Parameters<typeof buildNPCPortraitPrompt>[0] & { id?: string },
    emotion: string = 'neutral',
    config: ImageGenerateConfig,
    options?: ImageGenerateOptions,
    context?: { worldId?: string; spotId?: string },
    visualStyle?: WorldVisualStyle
): Promise<ImageGenerateResult> {
    const prompt = buildNPCPortraitPrompt(npc, emotion, visualStyle);
    return image_generate(prompt, config, {
        width: 512,
        height: 768,
        style: 'anime',
        ...options,
    }, `NPC立绘-${npc.name}`, 'image_npc_portrait', { ...context, npcId: npc.id });
}

/**
 * 生成项目封面图
 */
export async function image_generate_project_cover(
    project: Parameters<typeof buildProjectCoverPrompt>[0] & { id?: string },
    worldName: string,
    config: ImageGenerateConfig,
    options?: ImageGenerateOptions,
    context?: { worldId?: string },
    visualStyle?: WorldVisualStyle
): Promise<ImageGenerateResult> {
    const prompt = buildProjectCoverPrompt(project, worldName, visualStyle);
    return image_generate(prompt, config, {
        width: 1200,
        height: 675,
        style: 'fantasy',
        ...options,
    }, `项目封面-${project.name}`, 'image_project_cover', { ...context, projectId: project.id });
}

/**
 * 生成旅行器图片
 */
export async function image_generate_travel_vehicle(
    vehicle: Parameters<typeof buildTravelVehiclePrompt>[0] & { id?: string },
    worldName: string,
    config: ImageGenerateConfig,
    options?: ImageGenerateOptions,
    context?: { worldId?: string },
    visualStyle?: WorldVisualStyle
): Promise<ImageGenerateResult> {
    const prompt = buildTravelVehiclePrompt(vehicle, worldName, visualStyle);
    return image_generate(prompt, config, {
        width: 1600,
        height: 900,
        style: 'fantasy',
        ...options,
    }, `旅行器图片-${vehicle.name}`, 'image_vehicle', context);
}

// ============================================
// 导出
// ============================================

export const imageGenerator = {
    generate: image_generate,
    batch: image_generate_batch,
    worldCover: image_generate_world_cover,
    spot: image_generate_spot,
    npcPortrait: image_generate_npc_portrait,
    projectCover: image_generate_project_cover,
    travelVehicle: image_generate_travel_vehicle,
    // 辅助函数
    buildPrompt: {
        worldCover: buildWorldCoverPrompt,
        spot: buildSpotImagePrompt,
        npcPortrait: buildNPCPortraitPrompt,
        projectCover: buildProjectCoverPrompt,
        travelVehicle: buildTravelVehiclePrompt,
    },
    placeholder: getPlaceholderImage,
};

export default imageGenerator;
