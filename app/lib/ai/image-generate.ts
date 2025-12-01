/**
 * 图片生成服务 - 封装层
 * 
 * 提供统一的 image_generate 接口
 * 底层实现留空，由用户自行填充
 */

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
 * 生成世界封面图的提示词
 */
export function buildWorldCoverPrompt(world: {
    name: string;
    description: string;
    geography: string;
    tags: string[];
}): string {
    return `A stunning fantasy world landscape, ${world.name}, ${world.description}. 
Geography features: ${world.geography}. 
Style: epic fantasy art, cinematic lighting, detailed environment.
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
}, worldName: string): string {
    return `A beautiful scenic view of ${spot.name} in the fantasy world of ${worldName}.
Description: ${spot.description}
Features: ${spot.highlights.join(', ')}.
Style: detailed fantasy art, atmospheric, vibrant colors.
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
}, emotion: string = 'neutral'): string {
    const emotionMap: Record<string, string> = {
        neutral: 'calm and composed expression',
        happy: 'bright smile and joyful expression',
        sad: 'melancholic and wistful expression',
        surprised: 'wide-eyed surprised expression',
        angry: 'fierce and determined expression',
        thinking: 'thoughtful and contemplative expression',
    };

    return `A fantasy character portrait of ${npc.name}, a ${npc.role}.
Appearance: ${npc.appearance}
Expression: ${emotionMap[emotion] || emotionMap.neutral}
Personality traits visible: ${npc.personality.join(', ')}.
Style: anime/game character art, detailed, vibrant.
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
}, worldName: string): string {
    return `A captivating travel destination poster for ${project.name} in ${worldName}.
Description: ${project.description}
Theme: ${project.tags.join(', ')}.
Style: travel poster art, inspiring, adventurous mood.
High quality illustration.`;
}

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
    options: ImageGenerateOptions = {}
): Promise<ImageGenerateResult> {
    const startTime = Date.now();
    const { width = 1024, height = 768, style = 'fantasy' } = options;

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

    return {
        success: true,
        url,
        prompt,
        duration: Date.now() - startTime,
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
 * @returns 生成结果数组
 */
export async function image_generate_batch(
    prompts: string[],
    config: ImageGenerateConfig,
    options: ImageGenerateOptions = {}
): Promise<ImageGenerateResult[]> {
    // 并发执行所有生成任务
    const results = await Promise.all(
        prompts.map(prompt => image_generate(prompt, config, options))
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
    world: Parameters<typeof buildWorldCoverPrompt>[0],
    config: ImageGenerateConfig,
    options?: ImageGenerateOptions
): Promise<ImageGenerateResult> {
    const prompt = buildWorldCoverPrompt(world);
    return image_generate(prompt, config, {
        width: 1920,
        height: 1080,
        style: 'fantasy',
        ...options,
    });
}

/**
 * 生成景点图片
 */
export async function image_generate_spot(
    spot: Parameters<typeof buildSpotImagePrompt>[0],
    worldName: string,
    config: ImageGenerateConfig,
    options?: ImageGenerateOptions
): Promise<ImageGenerateResult> {
    const prompt = buildSpotImagePrompt(spot, worldName);
    return image_generate(prompt, config, {
        width: 1600,
        height: 900,
        style: 'fantasy',
        ...options,
    });
}

/**
 * 生成 NPC 立绘
 */
export async function image_generate_npc_portrait(
    npc: Parameters<typeof buildNPCPortraitPrompt>[0],
    emotion: string = 'neutral',
    config: ImageGenerateConfig,
    options?: ImageGenerateOptions
): Promise<ImageGenerateResult> {
    const prompt = buildNPCPortraitPrompt(npc, emotion);
    return image_generate(prompt, config, {
        width: 512,
        height: 768,
        style: 'anime',
        ...options,
    });
}

/**
 * 生成项目封面图
 */
export async function image_generate_project_cover(
    project: Parameters<typeof buildProjectCoverPrompt>[0],
    worldName: string,
    config: ImageGenerateConfig,
    options?: ImageGenerateOptions
): Promise<ImageGenerateResult> {
    const prompt = buildProjectCoverPrompt(project, worldName);
    return image_generate(prompt, config, {
        width: 1200,
        height: 675,
        style: 'fantasy',
        ...options,
    });
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
    // 辅助函数
    buildPrompt: {
        worldCover: buildWorldCoverPrompt,
        spot: buildSpotImagePrompt,
        npcPortrait: buildNPCPortraitPrompt,
        projectCover: buildProjectCoverPrompt,
    },
    placeholder: getPlaceholderImage,
};

export default imageGenerator;
