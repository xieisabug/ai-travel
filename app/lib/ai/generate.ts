/**
 * AI 生成服务 - 核心生成函数封装
 * 
 * 提供统一的 ai_generate 接口，底层使用 OpenAI 实现
 * 支持文本生成、结构化数据生成等功能
 */

import type {
    World,
    TravelProject,
    TravelVehicle,
    Spot,
    SpotNPC,
    GenerateWorldRequest,
    WorldVisualStyle,
} from '~/types/world';

import {
    createAICallRecord,
    completeAICallRecord,
    saveAICallRecord,
    type AICallContext,
    type AICallType,
} from './ai-call-recorder';

// ============================================
// 生成配置类型
// ============================================

export interface AIGenerateConfig {
    /** OpenAI API Key */
    apiKey?: string;
    /** API 基础 URL（支持自定义端点） */
    baseURL?: string;
    /** 模型名称 */
    model?: string;
    /** 温度参数 (0-2) */
    temperature?: number;
    /** 最大 token 数 */
    maxTokens?: number;
}

export interface GenerateOptions {
    /** 生成超时时间（毫秒） */
    timeout?: number;
    /** 重试次数 */
    retries?: number;
    /** 是否启用流式输出 */
    stream?: boolean;
}

// ============================================
// 生成结果类型
// ============================================

export interface GenerateResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

// ============================================
// Prompt 模板
// ============================================

// ============================================
// 基础 System Prompt - 定义 AI 角色和安全边界
// ============================================

const BASE_SYSTEM_PROMPT = `你是一个专业的游戏内容设计师和虚拟导游，专门为全年龄段玩家创造独特有趣的虚拟世界和旅游体验。

【重要规则 - 必须严格遵守】
1. 内容安全：所有生成的内容必须适合全年龄段玩家（包括儿童），禁止任何暴力、恐怖、色情、政治敏感内容
2. 保持神秘感：营造奇幻神秘的氛围，但不要引起不适或恐惧感
3. 逻辑一致性：你生成的所有内容必须与已提供的世界设定保持严格一致，不得自相矛盾
4. 积极向上：传达探索的乐趣、文化的多样性、友好的交流
5. 尊重设定：如果已经给出了世界的地理/气候/文化等设定，后续生成内容必须与之匹配

请始终返回有效的 JSON 格式。`;

/**
 * 构建包含世界设定的增强 System Prompt
 * 将所有世界设定信息注入 system prompt，确保 AI 不会自相矛盾
 */
function buildEnhancedSystemPrompt(world?: World): string {
    if (!world) {
        return BASE_SYSTEM_PROMPT;
    }

    return `${BASE_SYSTEM_PROMPT}

【当前世界设定 - 所有生成内容必须与以下设定保持一致】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
世界名称：${world.name}
${world.subtitle ? `世界别称：${world.subtitle}` : ''}
简介：${world.description}
详细描述：${world.detailedDescription}

【地理与气候】
地理特征：${world.geography}
气候特点：${world.climate}
${world.bestTimeToVisit ? `最佳旅游时间：${world.bestTimeToVisit}` : ''}

【文化与居民】
文化特色：${world.culture}
当地居民：${world.inhabitants}
语言/交流：${world.language}
货币/交易：${world.currency}
特色美食：${world.cuisine}
${world.rules ? `特殊规则/禁忌：${world.rules}` : ''}

【世界标签】${world.tags.join('、')}

${world.visualStyle ? `【视觉风格设定】
绘画风格：${world.visualStyle.artStyle}
色调：${world.visualStyle.colorPalette}
光影：${world.visualStyle.lighting}
氛围：${world.visualStyle.mood}
风格描述：${world.visualStyle.styleDescription}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【一致性检查提醒】
- 如果世界是"极寒之地"，就不能出现"岩浆"、"酷热"等矛盾元素
- 如果世界居民是"和平的精灵"，就不能出现好战的描述
- 所有景点、NPC、对话都必须符合上述世界观设定`;
}

const PROMPTS = {
    // 世界生成 prompt
    generateWorld: (theme?: string) => `请创造一个独特的、不存在于现实中的虚拟幻想世界。

${theme ? `主题/风格提示: ${theme}` : '请自由发挥创意，创造一个独特的幻想世界。'}

请生成一个完整的世界描述，包含以下内容：

【基础信息】
1. 世界名称（富有想象力的名字）
2. 副标题/别称
3. 简短描述（50字以内，概括世界特色）
4. 详细描述（200字左右，描绘世界的整体面貌）

【地理与气候】（非常重要！后续所有内容都必须与此一致）
5. 地理特征（详细描述地形、环境特点）
6. 气候特点（详细描述天气、温度、季节特点）

【文化与居民】
7. 文化特色
8. 当地居民特点
9. 特色美食
10. 语言/交流方式
11. 货币/交易方式
12. 特殊规则或禁忌
13. 最佳旅游时间

【标签与风格】
14. 3-5个特色标签

【视觉风格设定】（非常重要！确保整个世界的图片风格统一）
15. 选择一个统一的绘画风格，并详细描述

请以 JSON 格式返回：
{
    "name": "世界名称",
    "subtitle": "副标题",
    "description": "简短描述",
    "detailedDescription": "详细描述",
    "geography": "地理特征（详细描述）",
    "climate": "气候特点（详细描述）",
    "culture": "文化特色",
    "inhabitants": "居民特点",
    "cuisine": "特色美食",
    "language": "语言描述",
    "currency": "货币描述",
    "rules": "特殊规则",
    "bestTimeToVisit": "最佳旅游时间",
    "tags": ["标签1", "标签2", "标签3"],
    "visualStyle": {
        "artStyle": "watercolor|pixel|anime|realistic|oil-painting|sketch|fantasy-illustration 之一",
        "colorPalette": "warm|cool|pastel|vibrant|muted|monochrome|neon 之一",
        "lighting": "soft|dramatic|flat|cinematic|ethereal|harsh 之一",
        "mood": "mysterious|cheerful|melancholic|epic|serene|whimsical|dark 之一",
        "styleKeywords": ["风格关键词1", "风格关键词2", "风格关键词3"],
        "styleDescription": "用一段话详细描述这个世界应该呈现的视觉风格，包括色彩、笔触、氛围等，供图片生成使用"
    }
}`,

    // 区域生成 prompt（原“旅游项目”）
    generateTravelProjects: (world: World, count: number = 3) => `请为当前世界设计 ${count} 个独特的区域。

【重要提醒】
- 所有区域必须与世界的地理（${world.geography.slice(0, 50)}...）和气候（${world.climate.slice(0, 50)}...）相符
- 区域内容必须体现世界的文化特色（${world.culture.slice(0, 50)}...）
- 确保区域之间有差异化，覆盖不同的体验类型

每个区域应包含：
1. 区域名称（与世界风格契合）
2. 区域描述（100字左右，突出特色体验）
3. 推荐游玩天数
4. 难度等级（1-5）
5. 特色标签（3-5个）
6. 适合人群描述

请以 JSON 数组格式返回：
[
    {
        "name": "区域名称",
        "description": "区域描述",
        "duration": 3,
        "difficulty": 2,
        "tags": ["标签1", "标签2"],
        "suitableFor": "适合人群描述"
    }
]`,

    // 场景生成 prompt（原“景点”）
    generateSpots: (project: TravelProject, world: World, count: number = 5) => `请为以下区域设计 ${count} 个独特的场景：

区域信息：
- 区域名称：${project.name}
- 区域描述：${project.description}
- 区域标签：${project.tags.join('、')}

【重要提醒 - 一致性要求】
- 所有场景必须符合世界的地理特征
- 所有场景必须符合世界的气候特点
- 场景描述必须体现世界的文化特色
- 例如：如果是冰雪世界，场景应该有冰川、雪山、极光等元素，而不是沙漠、火山
- 例如：如果是海底世界，场景应该有珊瑚、海藻、水下建筑等，而不是陆地森林

每个场景应包含：
1. 场景名称（富有想象力，与世界风格契合）
2. 简短描述（50字以内）
3. 详细描述（150字左右，细节要与世界设定一致）
4. 历史/传说故事（200字左右，与世界文化背景相符）
5. 3-5个亮点
6. 参观建议
7. 建议游览时长（分钟）

请以 JSON 数组格式返回，并按照推荐的游览顺序排列：
[
    {
        "name": "场景名称",
        "description": "简短描述",
        "detailedDescription": "详细描述",
        "story": "历史传说故事",
        "highlights": ["亮点1", "亮点2", "亮点3"],
        "visitTips": "参观建议",
        "suggestedDuration": 60
    }
]`,

    // 世界级 NPC 生成 prompt（不依赖景点）
    generateWorldNPC: (world: World, userPrompt: string) => `请根据用户的需求描述，为当前世界创建一个独特的 NPC 角色。

【用户需求】
${userPrompt}

【重要提醒 - 角色设定要求】
- NPC 必须符合世界的居民特点：${world.inhabitants}
- NPC 的说话风格必须符合世界的语言特色：${world.language}
- NPC 的性格和外貌必须与世界文化相符
- NPC 必须是友善、有趣、适合全年龄段的角色
- 角色应该能够为游客提供有价值的信息和互动体验
- 必须充分结合用户的需求描述来设计角色

请创建一个符合世界观和用户需求的 NPC，包含：
1. 名称（符合世界文化的名字）
2. 角色定位（如：导游、店主、守护者、居民等）
3. 简短描述
4. 背景故事（150字左右，与世界背景有关联）
5. 性格特点（3-5个积极正面的词语）
6. 外貌描述（详细描述外貌特征，用于生成立绘，必须与世界居民特点相符）
7. 说话风格（必须与世界语言特色相符）
8. 兴趣爱好

请以 JSON 格式返回：
{
    "name": "NPC名称",
    "role": "角色定位",
    "description": "简短描述",
    "backstory": "背景故事",
    "personality": ["性格1", "性格2", "性格3"],
    "appearance": "详细外貌描述",
    "speakingStyle": "说话风格",
    "interests": ["兴趣1", "兴趣2"]
}`,

    // NPC 生成 prompt（基于景点）
    generateNPC: (spot: Spot, world: World) => `请为以下景点创建一个独特的 NPC 角色：

场景信息：
- 场景名称：${spot.name}
- 场景描述：${spot.description}
- 场景故事：${spot.story}

【重要提醒 - 角色设定要求】
- NPC 必须符合世界的居民特点：${world.inhabitants}
- NPC 的说话风格必须符合世界的语言特色：${world.language}
- NPC 的性格和外貌必须与世界文化相符
- NPC 必须是友善、有趣、适合全年龄段的角色
- 角色应该能够为游客提供有价值的信息和互动体验

请创建一个符合这个场景和世界观的 NPC，包含：
1. 名称（符合世界文化的名字）
2. 角色定位（如：导游、店主、守护者、居民等）
3. 简短描述
4. 背景故事（150字左右，与场景故事有关联）
5. 性格特点（3-5个积极正面的词语）
6. 外貌描述（详细描述外貌特征，用于生成立绘，必须与世界居民特点相符）
7. 说话风格（必须与世界语言特色相符）
8. 兴趣爱好

请以 JSON 格式返回：
{
    "name": "NPC名称",
    "role": "角色定位",
    "description": "简短描述",
    "backstory": "背景故事",
    "personality": ["性格1", "性格2", "性格3"],
    "appearance": "详细外貌描述",
    "speakingStyle": "说话风格",
    "interests": ["兴趣1", "兴趣2"]
}`,

    // 对话生成 prompt
    generateDialog: (npc: SpotNPC, context: string, world: World) => `请为以下 NPC 生成一段对话：

NPC 信息：
- 名称：${npc.name}
- 角色：${npc.role}
- 性格：${npc.personality.join('、')}
- 说话风格：${npc.speakingStyle}
- 背景：${npc.backstory}

对话场景：${context}

【重要提醒 - 对话生成要求】
- 对话内容必须符合 NPC 的性格和说话风格
- 对话必须体现世界的文化特色（${world.culture.slice(0, 50)}...）
- 对话必须使用世界的语言风格（${world.language.slice(0, 50)}...）
- 内容必须积极向上、友善有趣，适合全年龄段
- 可以透露一些关于世界的有趣信息，增加神秘感
- 不要出现任何与世界设定矛盾的内容

请生成 NPC 的对话内容：

请以 JSON 格式返回：
{
    "greeting": "初次见面的招呼语（要有角色特色）",
    "mainDialog": ["对话1", "对话2", "对话3（3-5段有趣的对话内容）"],
    "farewell": "告别语（温馨友好的道别）"
}`,

    // 旅行器生成 prompt
    generateTravelVehicle: (world: World) => `请为当前世界设计一个独特的旅行器（交通工具）。

【重要提醒 - 设计要求】
- 旅行器必须与世界的地理环境相匹配（能在 ${world.geography.slice(0, 30)}... 中有效移动）
- 旅行器必须适应世界的气候特点（${world.climate.slice(0, 30)}...）
- 旅行器的风格必须与世界文化相符
- 可以是任何有创意的形式：魔法飞艇、机械列车、生物坐骑、能量体、传送门系统等
- 设计要充满想象力但符合世界观逻辑

请设计一个符合这个世界观的独特旅行器：

请以 JSON 格式返回：
{
    "name": "旅行器名称（富有想象力）",
    "type": "类型（如：飞艇、列车、巨龙等）",
    "description": "简短描述（50字以内）",
    "detailedDescription": "详细描述（150字左右）",
    "capacity": 20,
    "speed": "速度描述",
    "abilities": ["特殊能力1", "特殊能力2", "特殊能力3"],
    "comfortLevel": 4,
    "appearance": "详细的外观描述（用于生成图片，200字左右，要与世界视觉风格一致）",
    "interiorDescription": "内部设施描述（100字左右）"
}`,
};

// ============================================
// 日志工具
// ============================================

const aiLogger = {
    prompt: (label: string, prompt: string) => {
        console.log(`\n[AI-Generate] ========== ${label} - PROMPT ==========`);
        console.log(prompt);
        console.log(`[AI-Generate] ========== END PROMPT ==========\n`);
    },
    response: (label: string, response: unknown) => {
        console.log(`\n[AI-Generate] ========== ${label} - RESPONSE ==========`);
        console.log(JSON.stringify(response, null, 2));
        console.log(`[AI-Generate] ========== END RESPONSE ==========\n`);
    },
    error: (label: string, error: string, attempt: number, maxRetries: number) => {
        console.error(`[AI-Generate] ❌ ${label} 失败 (尝试 ${attempt + 1}/${maxRetries + 1}): ${error}`);
    },
    retry: (label: string, attempt: number, maxRetries: number, waitTime: number) => {
        console.log(`[AI-Generate] 🔄 ${label} 重试中... (${attempt + 1}/${maxRetries + 1}), 等待 ${waitTime}ms`);
    },
};

// ============================================
// OpenAI 调用封装
// ============================================

/**
 * 调用 OpenAI API 生成内容
 * @param prompt 用户 prompt
 * @param config AI 配置
 * @param options 生成选项
 * @param logLabel 日志标签
 * @param callType AI 调用类型
 * @param callContext 调用上下文
 * @param systemPrompt 自定义 system prompt（可选，默认使用基础 prompt）
 */
async function callOpenAI<T>(
    prompt: string,
    config: AIGenerateConfig,
    options: GenerateOptions = {},
    logLabel: string = 'AI调用',
    callType: AICallType = 'generate_text',
    callContext: AICallContext = {},
    systemPrompt: string = BASE_SYSTEM_PROMPT
): Promise<GenerateResult<T>> {
    const {
        apiKey = '',
        baseURL = 'https://new-api.663721.xyz/v1',
        model = 'gemini-3-pro-preview',
        temperature = 0.8,
        maxTokens = 16000,
    } = config;

    const { timeout = 600000, retries = 5 } = options;

    // 打印 prompt
    aiLogger.prompt(logLabel, prompt);

    // 创建 AI 调用记录
    const record = createAICallRecord(callType, prompt, callContext);
    const startTime = Date.now();
    let retryCount = 0;

    if (!apiKey) {
        const completedRecord = completeAICallRecord(record, {
            success: false,
            error: 'OpenAI API Key is required',
            model,
            duration: Date.now() - startTime,
            retryCount: 0,
        });
        await saveAICallRecord(completedRecord);

        return {
            success: false,
            error: 'OpenAI API Key is required',
        };
    }

    let lastError: string = '';

    for (let attempt = 0; attempt <= retries; attempt++) {
        retryCount = attempt;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(`${baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt,
                        },
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                    temperature,
                    max_tokens: maxTokens,
                    response_format: { type: 'json_object' },
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
                throw new Error(errorData.error?.message || `HTTP ${response.status}`);
            }

            const data = await response.json() as {
                choices?: Array<{ message?: { content?: string } }>;
                usage?: {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                };
            };
            const content = data.choices?.[0]?.message?.content;

            if (!content) {
                throw new Error('Empty response from OpenAI');
            }

            // 解析 JSON 响应
            const parsed = JSON.parse(content) as T;

            // 打印 response
            aiLogger.response(logLabel, parsed);

            const usage = data.usage ? {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens,
            } : undefined;

            // 保存成功记录
            const completedRecord = completeAICallRecord(record, {
                success: true,
                response: content,
                model,
                tokenUsage: usage,
                duration: Date.now() - startTime,
                retryCount,
            });
            await saveAICallRecord(completedRecord);

            return {
                success: true,
                data: parsed,
                usage,
            };
        } catch (error) {
            lastError = error instanceof Error ? error.message : String(error);
            aiLogger.error(logLabel, lastError, attempt, retries);

            if (attempt < retries) {
                // 等待后重试，递增等待时间
                const waitTime = 1000 * (attempt + 1);
                aiLogger.retry(logLabel, attempt, retries, waitTime);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    console.error(`[AI-Generate] ❌ ${logLabel} 最终失败，已重试 ${retries + 1} 次`);

    // 保存失败记录
    const completedRecord = completeAICallRecord(record, {
        success: false,
        error: lastError,
        model,
        duration: Date.now() - startTime,
        retryCount,
    });
    await saveAICallRecord(completedRecord);

    return {
        success: false,
        error: lastError,
    };
}

// ============================================
// AI 生成函数
// ============================================

/**
 * 生成虚拟世界
 */
export async function ai_generate_world(
    request: GenerateWorldRequest,
    config: AIGenerateConfig,
    options?: GenerateOptions,
    context?: AICallContext
): Promise<GenerateResult<Omit<World, 'id' | 'createdAt' | 'generationStatus' | 'travelProjects' | 'travelVehicle'>>> {
    const prompt = PROMPTS.generateWorld(request.theme);
    return callOpenAI(prompt, config, options, '生成世界', 'generate_world', context || {});
}

/**
 * 生成旅游项目列表
 */
export async function ai_generate_travel_projects(
    world: World,
    count: number = 3,
    config: AIGenerateConfig,
    options?: GenerateOptions
): Promise<GenerateResult<Array<Omit<TravelProject, 'id' | 'worldId' | 'spots' | 'tourRoute' | 'generationStatus' | 'selectedCount' | 'createdAt'>>>> {
    const prompt = PROMPTS.generateTravelProjects(world, count);
    // 使用包含世界设定的增强 system prompt
    const enhancedSystemPrompt = buildEnhancedSystemPrompt(world);

    const result = await callOpenAI<{ projects?: unknown[] } | unknown[]>(
        prompt, config, options, '生成旅游项目', 'generate_projects', { worldId: world.id }, enhancedSystemPrompt
    );

    if (result.success && result.data) {
        // 处理可能的包装格式
        const projects = Array.isArray(result.data) ? result.data : (result.data as { projects?: unknown[] }).projects;
        return {
            ...result,
            data: projects as Array<Omit<TravelProject, 'id' | 'worldId' | 'spots' | 'tourRoute' | 'generationStatus' | 'selectedCount' | 'createdAt'>>,
        };
    }

    return result as GenerateResult<Array<Omit<TravelProject, 'id' | 'worldId' | 'spots' | 'tourRoute' | 'generationStatus' | 'selectedCount' | 'createdAt'>>>;
}

/**
 * 生成景点列表
 */
export async function ai_generate_spots(
    project: TravelProject,
    world: World,
    count: number = 5,
    config: AIGenerateConfig,
    options?: GenerateOptions
): Promise<GenerateResult<Array<Omit<Spot, 'id' | 'projectId' | 'npcs' | 'hotspots' | 'orderInRoute' | 'generationStatus'>>>> {
    const prompt = PROMPTS.generateSpots(project, world, count);
    // 使用包含世界设定的增强 system prompt
    const enhancedSystemPrompt = buildEnhancedSystemPrompt(world);

    const result = await callOpenAI<{ spots?: unknown[] } | unknown[]>(
        prompt, config, options, '生成景点', 'generate_spots', { worldId: world.id, projectId: project.id }, enhancedSystemPrompt
    );

    if (result.success && result.data) {
        const spots = Array.isArray(result.data) ? result.data : (result.data as { spots?: unknown[] }).spots;
        return {
            ...result,
            data: spots as Array<Omit<Spot, 'id' | 'projectId' | 'npcs' | 'hotspots' | 'orderInRoute' | 'generationStatus'>>,
        };
    }

    return result as GenerateResult<Array<Omit<Spot, 'id' | 'projectId' | 'npcs' | 'hotspots' | 'orderInRoute' | 'generationStatus'>>>;
}

/**
 * 生成世界级 NPC（不依赖景点）
 */
export async function ai_generate_world_npc(
    world: World,
    userPrompt: string,
    config: AIGenerateConfig,
    options?: GenerateOptions
): Promise<GenerateResult<Omit<SpotNPC, 'id' | 'worldId' | 'spotId' | 'sprite' | 'sprites' | 'greetingDialogId' | 'dialogOptions' | 'generationStatus'>>> {
    const prompt = PROMPTS.generateWorldNPC(world, userPrompt);
    // 使用包含世界设定的增强 system prompt
    const enhancedSystemPrompt = buildEnhancedSystemPrompt(world);
    return callOpenAI(prompt, config, options, `生成世界NPC-${world.name}`, 'generate_world_npc', { worldId: world.id }, enhancedSystemPrompt);
}

/**
 * 生成 NPC（基于景点）
 */
export async function ai_generate_npc(
    spot: Spot,
    world: World,
    config: AIGenerateConfig,
    options?: GenerateOptions
): Promise<GenerateResult<Omit<SpotNPC, 'id' | 'sprite' | 'sprites' | 'greetingDialogId' | 'dialogOptions' | 'generationStatus'>>> {
    const prompt = PROMPTS.generateNPC(spot, world);
    // 使用包含世界设定的增强 system prompt
    const enhancedSystemPrompt = buildEnhancedSystemPrompt(world);
    return callOpenAI(prompt, config, options, `生成NPC-${spot.name}`, 'generate_npc', { worldId: world.id, spotId: spot.id }, enhancedSystemPrompt);
}

/**
 * 生成对话
 */
export async function ai_generate_dialog(
    npc: SpotNPC,
    context: string,
    world: World,
    config: AIGenerateConfig,
    options?: GenerateOptions
): Promise<GenerateResult<{
    greeting: string;
    mainDialog: string[];
    farewell: string;
}>> {
    const prompt = PROMPTS.generateDialog(npc, context, world);
    // 使用包含世界设定的增强 system prompt
    const enhancedSystemPrompt = buildEnhancedSystemPrompt(world);
    return callOpenAI(prompt, config, options, `生成对话-${npc.name}`, 'generate_dialog', { worldId: world.id, npcId: npc.id }, enhancedSystemPrompt);
}

/**
 * 通用文本生成
 */
export async function ai_generate_text(
    prompt: string,
    config: AIGenerateConfig,
    options?: GenerateOptions,
    context?: AICallContext
): Promise<GenerateResult<string>> {
    const result = await callOpenAI<{ text: string } | string>(prompt, config, options, '通用文本生成', 'generate_text', context || {});

    if (result.success && result.data) {
        const text = typeof result.data === 'string' ? result.data : (result.data as { text: string }).text;
        return {
            ...result,
            data: text,
        };
    }

    return result as GenerateResult<string>;
}

/**
 * 生成旅行器
 */
export async function ai_generate_travel_vehicle(
    world: World,
    config: AIGenerateConfig,
    options?: GenerateOptions
): Promise<GenerateResult<Omit<TravelVehicle, 'id' | 'image' | 'createdAt' | 'generationStatus'>>> {
    const prompt = PROMPTS.generateTravelVehicle(world);
    // 使用包含世界设定的增强 system prompt
    const enhancedSystemPrompt = buildEnhancedSystemPrompt(world);
    return callOpenAI(prompt, config, options, '生成旅行器', 'generate_vehicle', { worldId: world.id }, enhancedSystemPrompt);
}

// ============================================
// 游戏对话生成（用于前端游戏交互）
// ============================================

/**
 * 对话行（用于前端打字机效果显示）
 */
export interface DialogLine {
    speaker: string;
    text: string;
    emotion?: string;
}

/**
 * 生成 NPC 游戏对话
 * 专门为前端游戏交互设计，返回格式化的对话行列表
 */
export async function ai_generate_npc_dialog(
    params: {
        npc: SpotNPC;
        spot: Spot;
        world: World;
        dialogType: 'entry' | 'chat';
        previousDialog?: string[];
    },
    config: AIGenerateConfig,
    options?: GenerateOptions
): Promise<GenerateResult<DialogLine[]>> {
    const { npc, spot, world, dialogType, previousDialog } = params;

    const dialogTypeDescription = dialogType === 'entry'
        ? '玩家刚刚来到这个场景，这是第一次见面的入场对话'
        : '玩家想要和 NPC 继续聊天';

    const previousContext = previousDialog && previousDialog.length > 0
        ? `\n\n之前的对话内容：\n${previousDialog.join('\n')}`
        : '';

    const prompt = `请为以下场景生成 NPC 对话。

【NPC 信息】
- 名称：${npc.name}
- 角色：${npc.role}
- 性格：${npc.personality.join('、')}
- 说话风格：${npc.speakingStyle}
- 背景故事：${npc.backstory}
- 兴趣爱好：${npc.interests?.join('、') || '无'}

【场景信息】
- 场景名称：${spot.name}
- 场景描述：${spot.description}
- 场景故事：${spot.story}
- 场景亮点：${spot.highlights.join('、')}

【场景说明】
${dialogTypeDescription}
${previousContext}

【生成要求】
1. 对话必须完全符合 NPC 的性格和说话风格
2. 内容要体现世界的文化特色
3. ${dialogType === 'entry' ? '要包含对场景的介绍和欢迎语' : '可以聊一些有趣的话题，透露世界的秘密或趣事'}
4. 每段对话控制在 30-80 字之间，适合打字机效果展示
5. 生成 3-5 段对话
6. 情绪要与对话内容匹配

请以 JSON 格式返回：
{
    "dialogLines": [
        {
            "speaker": "${npc.name}",
            "text": "对话内容",
            "emotion": "neutral|happy|sad|surprised|angry|thinking 之一"
        }
    ]
}`;

    const enhancedSystemPrompt = buildEnhancedSystemPrompt(world);

    const result = await callOpenAI<{ dialogLines: DialogLine[] }>(
        prompt,
        config,
        options,
        `生成游戏对话-${npc.name}`,
        'generate_dialog',
        { worldId: world.id, npcId: npc.id, spotId: spot.id },
        enhancedSystemPrompt
    );

    if (result.success && result.data?.dialogLines) {
        return {
            success: true,
            data: result.data.dialogLines,
            usage: result.usage,
        };
    }

    return {
        success: false,
        error: result.error || '对话生成失败',
    };
}

// ============================================
// 导出
// ============================================

export const ai_generate = {
    world: ai_generate_world,
    travelProjects: ai_generate_travel_projects,
    travelVehicle: ai_generate_travel_vehicle,
    spots: ai_generate_spots,
    worldNpc: ai_generate_world_npc,
    npc: ai_generate_npc,
    dialog: ai_generate_dialog,
    npcDialog: ai_generate_npc_dialog,
    text: ai_generate_text,
};

export default ai_generate;
