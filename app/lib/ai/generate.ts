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
} from '~/types/world';

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

const PROMPTS = {
    // 世界生成 prompt
    generateWorld: (theme?: string) => `你是一个专业的奇幻世界设计师。请创造一个独特的、不存在于现实中的虚拟世界。

${theme ? `主题/风格提示: ${theme}` : '请自由发挥创意，创造一个独特的幻想世界。'}

请生成一个完整的世界描述，包含以下内容：
1. 世界名称和副标题
2. 简短描述（50字以内）
3. 详细描述（200字左右）
4. 地理特征
5. 气候特点
6. 文化特色
7. 当地居民特点
8. 特色美食
9. 语言/交流方式
10. 货币/交易方式
11. 特殊规则或禁忌
12. 最佳旅游时间
13. 3-5个特色标签

请以 JSON 格式返回，格式如下：
{
    "name": "世界名称",
    "subtitle": "副标题",
    "description": "简短描述",
    "detailedDescription": "详细描述",
    "geography": "地理特征",
    "climate": "气候特点",
    "culture": "文化特色",
    "inhabitants": "居民特点",
    "cuisine": "特色美食",
    "language": "语言描述",
    "currency": "货币描述",
    "rules": "特殊规则",
    "bestTimeToVisit": "最佳旅游时间",
    "tags": ["标签1", "标签2", "标签3"]
}`,

    // 旅游项目生成 prompt
    generateTravelProjects: (world: World, count: number = 3) => `基于以下虚拟世界，请设计 ${count} 个独特的旅游项目：

世界信息：
- 名称：${world.name}
- 描述：${world.detailedDescription}
- 地理：${world.geography}
- 文化：${world.culture}
- 特色：${world.tags.join('、')}

每个旅游项目应包含：
1. 项目名称
2. 项目描述（100字左右）
3. 推荐游玩天数
4. 难度等级（1-5）
5. 特色标签（3-5个）
6. 适合人群描述

请以 JSON 数组格式返回：
[
    {
        "name": "项目名称",
        "description": "项目描述",
        "duration": 3,
        "difficulty": 2,
        "tags": ["标签1", "标签2"],
        "suitableFor": "适合人群描述"
    }
]`,

    // 景点生成 prompt
    generateSpots: (project: TravelProject, world: World, count: number = 5) => `基于以下旅游项目，请设计 ${count} 个独特的景点：

世界背景：
- 名称：${world.name}
- 文化：${world.culture}
- 地理：${world.geography}

旅游项目：
- 名称：${project.name}
- 描述：${project.description}
- 标签：${project.tags.join('、')}

每个景点应包含：
1. 景点名称
2. 简短描述（50字以内）
3. 详细描述（150字左右）
4. 历史/传说故事（200字左右）
5. 3-5个亮点
6. 参观建议
7. 建议游览时长（分钟）

请以 JSON 数组格式返回，并按照推荐的游览顺序排列：
[
    {
        "name": "景点名称",
        "description": "简短描述",
        "detailedDescription": "详细描述",
        "story": "历史传说故事",
        "highlights": ["亮点1", "亮点2", "亮点3"],
        "visitTips": "参观建议",
        "suggestedDuration": 60
    }
]`,

    // NPC 生成 prompt
    generateNPC: (spot: Spot, world: World) => `为以下景点创建一个独特的 NPC 角色：

世界背景：
- 名称：${world.name}
- 文化：${world.culture}
- 居民特点：${world.inhabitants}
- 语言风格：${world.language}

景点信息：
- 名称：${spot.name}
- 描述：${spot.description}
- 故事：${spot.story}

请创建一个符合这个景点和世界观的 NPC，包含：
1. 名称
2. 角色定位（如：导游、店主、守护者、居民等）
3. 简短描述
4. 背景故事（150字左右）
5. 性格特点（3-5个词语）
6. 外貌描述（用于生成立绘）
7. 说话风格
8. 兴趣爱好

请以 JSON 格式返回：
{
    "name": "NPC名称",
    "role": "角色定位",
    "description": "简短描述",
    "backstory": "背景故事",
    "personality": ["性格1", "性格2", "性格3"],
    "appearance": "外貌描述",
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

世界观：${world.name} - ${world.culture}

对话场景：${context}

请生成 NPC 的对话内容，注意：
1. 符合 NPC 的性格和说话风格
2. 体现世界观的特色
3. 语言生动有趣

请以 JSON 格式返回：
{
    "greeting": "初次见面的招呼语",
    "mainDialog": ["对话1", "对话2", "对话3"],
    "farewell": "告别语"
}`,

    // 旅行器生成 prompt
    generateTravelVehicle: (world: World) => `为以下虚拟世界设计一个独特的旅行器（交通工具）：

世界信息：
- 名称：${world.name}
- 描述：${world.detailedDescription}
- 地理：${world.geography}
- 气候：${world.climate}
- 文化：${world.culture}
- 特色：${world.tags.join('、')}

请设计一个符合这个世界观的独特旅行器，它应该：
1. 与世界的风格和文化背景相匹配
2. 具有独特的外观和功能
3. 能够在这个世界的地理环境中有效移动
4. 可以是任何形式：魔法飞艇、机械列车、生物坐骑、传送门系统等

请以 JSON 格式返回：
{
    "name": "旅行器名称",
    "type": "类型（如：飞艇、列车、巨龙等）",
    "description": "简短描述（50字以内）",
    "detailedDescription": "详细描述（150字左右）",
    "capacity": 20,
    "speed": "速度描述",
    "abilities": ["特殊能力1", "特殊能力2", "特殊能力3"],
    "comfortLevel": 4,
    "appearance": "详细的外观描述（用于生成图片，200字左右）",
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
 */
async function callOpenAI<T>(
    prompt: string,
    config: AIGenerateConfig,
    options: GenerateOptions = {},
    logLabel: string = 'AI调用'
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

    if (!apiKey) {
        return {
            success: false,
            error: 'OpenAI API Key is required',
        };
    }

    let lastError: string = '';

    for (let attempt = 0; attempt <= retries; attempt++) {
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
                            content: '你是一个专业的游戏内容设计师，擅长创造独特有趣的虚拟世界和旅游体验。请始终返回有效的 JSON 格式。',
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

            return {
                success: true,
                data: parsed,
                usage: data.usage ? {
                    promptTokens: data.usage.prompt_tokens,
                    completionTokens: data.usage.completion_tokens,
                    totalTokens: data.usage.total_tokens,
                } : undefined,
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
    options?: GenerateOptions
): Promise<GenerateResult<Omit<World, 'id' | 'createdAt' | 'generationStatus' | 'travelProjects' | 'travelVehicle'>>> {
    const prompt = PROMPTS.generateWorld(request.theme);
    return callOpenAI(prompt, config, options, '生成世界');
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

    const result = await callOpenAI<{ projects?: unknown[] } | unknown[]>(prompt, config, options, '生成旅游项目');

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

    const result = await callOpenAI<{ spots?: unknown[] } | unknown[]>(prompt, config, options, '生成景点');

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
 * 生成 NPC
 */
export async function ai_generate_npc(
    spot: Spot,
    world: World,
    config: AIGenerateConfig,
    options?: GenerateOptions
): Promise<GenerateResult<Omit<SpotNPC, 'id' | 'sprite' | 'sprites' | 'greetingDialogId' | 'dialogOptions' | 'generationStatus'>>> {
    const prompt = PROMPTS.generateNPC(spot, world);
    return callOpenAI(prompt, config, options, `生成NPC-${spot.name}`);
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
    return callOpenAI(prompt, config, options, `生成对话-${npc.name}`);
}

/**
 * 通用文本生成
 */
export async function ai_generate_text(
    prompt: string,
    config: AIGenerateConfig,
    options?: GenerateOptions
): Promise<GenerateResult<string>> {
    const result = await callOpenAI<{ text: string } | string>(prompt, config, options, '通用文本生成');

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
    return callOpenAI(prompt, config, options, '生成旅行器');
}

// ============================================
// 导出
// ============================================

export const ai_generate = {
    world: ai_generate_world,
    travelProjects: ai_generate_travel_projects,
    travelVehicle: ai_generate_travel_vehicle,
    spots: ai_generate_spots,
    npc: ai_generate_npc,
    dialog: ai_generate_dialog,
    text: ai_generate_text,
};

export default ai_generate;
