/**
 * AI 内容生成抽象层 - 入口文件
 *
 * 提供统一的 AI 内容生成接口，支持多种 AI 后端
 */

export type {
    AIProviderConfig,
    AIProviderType,
    GeneratedImage,
    GeneratedText,
} from './types';

// AI 生成函数
export {
    ai_generate,
    ai_generate_world,
    ai_generate_travel_projects,
    ai_generate_spots,
    ai_generate_npc,
    ai_generate_dialog,
    ai_generate_text,
    type AIGenerateConfig,
    type GenerateOptions,
    type GenerateResult,
} from './generate';

// 图片生成函数
export {
    image_generate,
    image_generate_batch,
    image_generate_world_cover,
    image_generate_spot,
    image_generate_npc_portrait,
    image_generate_project_cover,
    image_generate_travel_vehicle,
    imageGenerator,
    buildWorldCoverPrompt,
    buildSpotImagePrompt,
    buildNPCPortraitPrompt,
    buildProjectCoverPrompt,
    buildTravelVehiclePrompt,
    getPlaceholderImage,
    type ImageGenerateConfig,
    type ImageGenerateOptions,
    type ImageGenerateResult,
} from './image-generate';

// 世界生成服务
export {
    WorldGenerationService,
    createWorldService,
    getWorldService,
    setWorldService,
    type WorldServiceConfig,
} from './world-service';
