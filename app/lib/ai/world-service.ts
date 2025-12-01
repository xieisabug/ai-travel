/**
 * 世界生成服务
 * 
 * 整合 AI 文本生成和图片生成，实现完整的世界和旅游项目生成流程
 * 支持并发生成以提高效率
 */

import type {
    World,
    TravelProject,
    Spot,
    SpotNPC,
    GenerateWorldRequest,
    TravelSession,
    TravelSessionStatus,
} from '~/types/world';

import {
    ai_generate,
    type AIGenerateConfig,
    type GenerateResult,
} from './generate';

import {
    imageGenerator,
    type ImageGenerateConfig,
} from './image-generate';

// ============================================
// 简单日志（兼容浏览器和 Node.js）
// ============================================

const log = {
    info: (msg: string, data?: unknown) => {
        console.log(`[WorldService] ✅ ${msg}`, data ?? '');
    },
    warn: (msg: string, data?: unknown) => {
        console.warn(`[WorldService] ⚠️ ${msg}`, data ?? '');
    },
    error: (msg: string, data?: unknown) => {
        console.error(`[WorldService] ❌ ${msg}`, data ?? '');
    },
    debug: (msg: string, data?: unknown) => {
        console.log(`[WorldService] 🔍 ${msg}`, data ?? '');
    },
    step: (step: number, total: number, msg: string) => {
        console.log(`[WorldService] 📍 [${step}/${total}] ${msg}`);
    },
};

// ============================================
// 服务配置
// ============================================

export interface WorldServiceConfig {
    /** AI 生成配置 */
    ai: AIGenerateConfig;
    /** 图片生成配置 */
    image: ImageGenerateConfig;
    /** 默认生成的旅游项目数量 */
    defaultProjectCount?: number;
    /** 默认生成的景点数量 */
    defaultSpotCount?: number;
    /** 每个景点默认的 NPC 数量 */
    defaultNpcPerSpot?: number;
    /** 启程等待时间（毫秒） */
    departureWaitTime?: number;
    /** 旅游完成后的冷却时间（毫秒） */
    cooldownTime?: number;
}

// ============================================
// 工具函数
// ============================================

/**
 * 生成唯一 ID
 */
function generateId(prefix: string = ''): string {
    return `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 获取当前时间戳
 */
function now(): string {
    return new Date().toISOString();
}

// ============================================
// 世界生成服务类
// ============================================

export class WorldGenerationService {
    private config: Required<WorldServiceConfig>;

    constructor(config: WorldServiceConfig) {
        this.config = {
            ai: config.ai,
            image: config.image,
            defaultProjectCount: config.defaultProjectCount ?? 3,
            defaultSpotCount: config.defaultSpotCount ?? 5,
            defaultNpcPerSpot: config.defaultNpcPerSpot ?? 1,
            departureWaitTime: config.departureWaitTime ?? 30000, // 30秒
            cooldownTime: config.cooldownTime ?? 60000, // 1分钟
        };
    }

    // ============================================
    // 步骤1: 生成世界基础描述
    // ============================================

    /**
     * 生成新世界
     * 首先生成世界的基础描述，然后生成封面图
     */
    async generateWorld(request: GenerateWorldRequest = {}): Promise<GenerateResult<World>> {
        log.info('🌍 开始生成世界...');
        log.debug('请求参数', request);

        // 1. 生成世界描述
        log.step(1, 3, '调用 AI 生成世界描述...');
        const startTime = Date.now();
        const descResult = await ai_generate.world(request, this.config.ai);
        const elapsed = Date.now() - startTime;

        if (!descResult.success || !descResult.data) {
            log.error('AI 生成世界描述失败', descResult.error);
            return {
                success: false,
                error: descResult.error || 'Failed to generate world description',
            };
        }

        log.info(`世界描述生成成功 (${elapsed}ms)`, {
            name: descResult.data.name,
            era: descResult.data.era,
        });

        // 2. 创建世界对象
        log.step(2, 3, '创建世界对象...');
        const world: World = {
            id: generateId('world_'),
            ...descResult.data,
            coverImage: undefined,
            travelProjects: [],
            createdAt: now(),
            generationStatus: 'generating',
        };

        log.info(`🌍 世界已创建: ${world.name}`, {
            id: world.id,
            geography: world.geography,
            tags: world.tags,
        });

        // 3. 生成封面图（异步，不阻塞）
        log.step(3, 3, '启动封面图生成（异步）...');
        this.generateWorldCoverAsync(world);

        // 4. 更新状态为 ready
        world.generationStatus = 'ready';
        log.info(`✨ 世界基础生成完成: ${world.name}`);

        return {
            success: true,
            data: world,
            usage: descResult.usage,
        };
    }

    /**
     * 异步生成世界封面图
     */
    private async generateWorldCoverAsync(world: World): Promise<void> {
        try {
            const result = await imageGenerator.worldCover(
                {
                    name: world.name,
                    description: world.description,
                    geography: world.geography,
                    tags: world.tags,
                },
                this.config.image
            );

            if (result.success && result.url) {
                world.coverImage = result.url;
            }
        } catch (error) {
            console.error('Failed to generate world cover:', error);
        }
    }

    // ============================================
    // 步骤2: 生成旅游项目
    // ============================================

    /**
     * 为世界生成旅游项目列表
     */
    async generateTravelProjects(
        world: World,
        count?: number
    ): Promise<GenerateResult<TravelProject[]>> {
        const projectCount = count ?? this.config.defaultProjectCount;
        log.info(`🧭 开始生成旅游项目... (数量: ${projectCount})`);

        // 1. 生成项目描述
        log.step(1, 3, '调用 AI 生成旅游项目描述...');
        const startTime = Date.now();
        const result = await ai_generate.travelProjects(
            world,
            projectCount,
            this.config.ai
        );
        const elapsed = Date.now() - startTime;

        if (!result.success || !result.data) {
            log.error('AI 生成旅游项目失败', result.error);
            return {
                success: false,
                error: result.error || 'Failed to generate travel projects',
            };
        }

        log.info(`旅游项目描述生成成功 (${elapsed}ms)`, {
            count: result.data.length,
            names: result.data.map(p => p.name),
        });

        // 2. 创建项目对象
        log.step(2, 3, '创建项目对象...');
        const projects: TravelProject[] = result.data.map((projectData, index) => ({
            id: generateId('project_'),
            ...projectData,
            worldId: world.id,
            coverImage: undefined,
            spots: [],
            tourRoute: [],
            generationStatus: 'pending' as const,
            selectedCount: 0,
            createdAt: now(),
        }));

        // 3. 并发生成所有项目的封面图
        log.step(3, 3, '启动项目封面图生成（并发）...');
        await this.generateProjectCoversAsync(projects, world.name);

        // 4. 更新世界状态
        world.travelProjects = projects;
        world.generationStatus = 'projects_ready';

        log.info(`✨ 旅游项目生成完成`, {
            worldName: world.name,
            projectCount: projects.length,
        });

        return {
            success: true,
            data: projects,
            usage: result.usage,
        };
    }

    /**
     * 并发生成项目封面图
     */
    private async generateProjectCoversAsync(
        projects: TravelProject[],
        worldName: string
    ): Promise<void> {
        const tasks = projects.map(async (project) => {
            try {
                const result = await imageGenerator.projectCover(
                    {
                        name: project.name,
                        description: project.description,
                        tags: project.tags,
                    },
                    worldName,
                    this.config.image
                );

                if (result.success && result.url) {
                    project.coverImage = result.url;
                }
            } catch (error) {
                console.error(`Failed to generate cover for project ${project.name}:`, error);
            }
        });

        await Promise.all(tasks);
    }

    // ============================================
    // 步骤3: 生成旅游详情（景点、NPC、故事）
    // ============================================

    /**
     * 生成项目详情
     * 当有玩家选择该项目时调用
     */
    async generateProjectDetails(
        project: TravelProject,
        world: World,
        spotCount?: number
    ): Promise<GenerateResult<TravelProject>> {
        const count = spotCount ?? this.config.defaultSpotCount;
        log.info(`🏗️ 开始生成项目详情: ${project.name}`);
        log.debug('项目信息', { projectId: project.id, worldName: world.name, spotCount: count });

        // 更新状态
        project.generationStatus = 'generating_details';

        // 1. 生成景点列表
        log.step(1, 5, '调用 AI 生成景点列表...');
        const startTime = Date.now();
        const spotsResult = await ai_generate.spots(project, world, count, this.config.ai);
        const elapsed = Date.now() - startTime;

        if (!spotsResult.success || !spotsResult.data) {
            project.generationStatus = 'error';
            log.error('AI 生成景点失败', spotsResult.error);
            return {
                success: false,
                error: spotsResult.error || 'Failed to generate spots',
            };
        }

        log.info(`景点列表生成成功 (${elapsed}ms)`, {
            count: spotsResult.data.length,
            names: spotsResult.data.map(s => s.name),
        });

        // 2. 创建景点对象
        log.step(2, 5, '创建景点对象...');
        const spots: Spot[] = spotsResult.data.map((spotData, index) => ({
            id: generateId('spot_'),
            ...spotData,
            image: undefined,
            projectId: project.id,
            npcs: [],
            hotspots: [],
            orderInRoute: index,
            generationStatus: 'generating_text' as const,
        }));

        project.spots = spots;
        project.tourRoute = spots.map(s => s.id);
        log.info(`创建了 ${spots.length} 个景点对象`);

        // 3. 并发生成每个景点的 NPC
        log.step(3, 5, '开始生成 NPC（并发）...');
        await this.generateSpotsNPCsAsync(spots, world);

        const totalNpcs = spots.reduce((sum, s) => sum + s.npcs.length, 0);
        log.info(`NPC 生成完成，共 ${totalNpcs} 个 NPC`);

        // 4. 更新状态为生成图片
        project.generationStatus = 'generating_images';
        log.step(4, 5, '开始生成图片（并发）...');

        // 5. 并发生成所有图片（景点图 + NPC 立绘）
        await this.generateAllImagesAsync(spots, world);
        log.info('图片生成完成');

        // 6. 更新状态为就绪
        log.step(5, 5, '完成项目详情生成');
        project.generationStatus = 'ready';
        project.detailsGeneratedAt = now();
        project.availableAt = new Date(
            Date.now() + this.config.departureWaitTime
        ).toISOString();

        log.info(`✨ 项目详情生成完成: ${project.name}`, {
            spotsCount: spots.length,
            npcsCount: totalNpcs,
        });

        return {
            success: true,
            data: project,
        };
    }

    /**
     * 并发生成所有景点的 NPC
     */
    private async generateSpotsNPCsAsync(spots: Spot[], world: World): Promise<void> {
        log.debug(`开始为 ${spots.length} 个景点生成 NPC...`);

        const tasks = spots.map(async (spot, index) => {
            try {
                log.debug(`[景点 ${index + 1}/${spots.length}] ${spot.name}: 开始生成 NPC`);

                // 为每个景点生成 NPC
                const npcCount = this.config.defaultNpcPerSpot;
                for (let i = 0; i < npcCount; i++) {
                    const result = await ai_generate.npc(spot, world, this.config.ai);

                    if (result.success && result.data) {
                        const npc: SpotNPC = {
                            id: generateId('npc_'),
                            ...result.data,
                            sprite: undefined,
                            sprites: undefined,
                            greetingDialogId: undefined,
                            dialogOptions: [],
                            generationStatus: 'generating_sprite',
                        };
                        spot.npcs.push(npc);
                        log.debug(`[景点 ${index + 1}] 创建 NPC: ${npc.name} (${npc.role})`);
                    }
                }

                spot.generationStatus = 'generating_image';
                log.info(`[景点 ${index + 1}/${spots.length}] ${spot.name}: NPC 生成完成 (${spot.npcs.length} 个)`);
            } catch (error) {
                log.error(`[景点 ${index + 1}] ${spot.name}: NPC 生成失败`, error);
                spot.generationStatus = 'error';
            }
        });

        await Promise.all(tasks);
        log.info(`所有景点 NPC 生成完成`);
    }

    /**
     * 并发生成所有图片
     */
    private async generateAllImagesAsync(spots: Spot[], world: World): Promise<void> {
        const allTasks: Promise<void>[] = [];

        for (const spot of spots) {
            // 景点图片
            allTasks.push(
                (async () => {
                    try {
                        const result = await imageGenerator.spot(
                            {
                                name: spot.name,
                                description: spot.description,
                                highlights: spot.highlights,
                            },
                            world.name,
                            this.config.image
                        );

                        if (result.success && result.url) {
                            spot.image = result.url;
                        }
                        spot.generationStatus = 'ready';
                    } catch (error) {
                        console.error(`Failed to generate image for spot ${spot.name}:`, error);
                    }
                })()
            );

            // NPC 立绘
            for (const npc of spot.npcs) {
                allTasks.push(
                    (async () => {
                        try {
                            const result = await imageGenerator.npcPortrait(
                                {
                                    name: npc.name,
                                    role: npc.role,
                                    appearance: npc.appearance,
                                    personality: npc.personality,
                                },
                                'neutral',
                                this.config.image
                            );

                            if (result.success && result.url) {
                                npc.sprite = result.url;
                            }
                            npc.generationStatus = 'ready';
                        } catch (error) {
                            console.error(`Failed to generate portrait for NPC ${npc.name}:`, error);
                        }
                    })()
                );
            }
        }

        await Promise.all(allTasks);
    }

    // ============================================
    // 步骤4: 创建旅游会话
    // ============================================

    /**
     * 创建旅游会话
     * 玩家选择项目后调用
     */
    createTravelSession(
        playerId: string,
        world: World,
        project: TravelProject
    ): TravelSession {
        const now = Date.now();
        const departureTime = project.availableAt
            ? new Date(project.availableAt).getTime()
            : now + this.config.departureWaitTime;

        // 估算旅游时间（每个景点的建议时长总和）
        const totalDuration = project.spots.reduce(
            (sum, spot) => sum + spot.suggestedDuration * 60 * 1000, // 转换为毫秒
            0
        );

        const estimatedReturnTime = departureTime + totalDuration;

        const session: TravelSession = {
            id: generateId('session_'),
            playerId,
            worldId: world.id,
            projectId: project.id,
            status: project.generationStatus === 'ready' ? 'departing' : 'preparing',
            currentSpotId: undefined,
            visitedSpots: [],
            progress: 0,
            departureTime: new Date(departureTime).toISOString(),
            estimatedReturnTime: new Date(estimatedReturnTime).toISOString(),
            actualReturnTime: undefined,
            memories: [],
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // 增加项目选择计数
        project.selectedCount++;

        return session;
    }

    /**
     * 开始探索（进入第一个景点）
     */
    startExploring(session: TravelSession, project: TravelProject): void {
        if (session.status !== 'departing') {
            return;
        }

        const firstSpotId = project.tourRoute[0];
        if (firstSpotId) {
            session.status = 'exploring';
            session.currentSpotId = firstSpotId;
            session.updatedAt = now();
        }
    }

    /**
     * 前往下一个景点
     */
    moveToNextSpot(session: TravelSession, project: TravelProject): Spot | null {
        if (session.status !== 'exploring' || !session.currentSpotId) {
            return null;
        }

        // 标记当前景点为已访问
        if (!session.visitedSpots.includes(session.currentSpotId)) {
            session.visitedSpots.push(session.currentSpotId);
        }

        // 找到下一个景点
        const currentIndex = project.tourRoute.indexOf(session.currentSpotId);
        const nextSpotId = project.tourRoute[currentIndex + 1];

        if (nextSpotId) {
            session.currentSpotId = nextSpotId;
            session.progress = ((currentIndex + 1) / project.tourRoute.length) * 100;
            session.updatedAt = now();

            return project.spots.find(s => s.id === nextSpotId) || null;
        } else {
            // 已完成所有景点，开始返程
            session.status = 'returning';
            session.progress = 100;
            session.updatedAt = now();
            return null;
        }
    }

    /**
     * 完成旅游
     */
    completeTravel(session: TravelSession): void {
        session.status = 'completed';
        session.actualReturnTime = now();
        session.updatedAt = now();
    }

    /**
     * 检查是否可以开始新的旅游
     */
    canStartNewTravel(lastSession: TravelSession | null): boolean {
        if (!lastSession) {
            return true;
        }

        if (lastSession.status !== 'completed') {
            return false;
        }

        if (!lastSession.actualReturnTime) {
            return true;
        }

        const returnTime = new Date(lastSession.actualReturnTime).getTime();
        const cooldownEnd = returnTime + this.config.cooldownTime;

        return Date.now() >= cooldownEnd;
    }

    /**
     * 获取冷却剩余时间
     */
    getCooldownRemaining(lastSession: TravelSession): number {
        if (lastSession.status !== 'completed' || !lastSession.actualReturnTime) {
            return 0;
        }

        const returnTime = new Date(lastSession.actualReturnTime).getTime();
        const cooldownEnd = returnTime + this.config.cooldownTime;
        const remaining = cooldownEnd - Date.now();

        return Math.max(0, remaining);
    }
}

// ============================================
// 导出工厂函数
// ============================================

let defaultService: WorldGenerationService | null = null;

/**
 * 创建世界生成服务实例
 */
export function createWorldService(config: WorldServiceConfig): WorldGenerationService {
    return new WorldGenerationService(config);
}

/**
 * 获取默认服务实例
 */
export function getWorldService(): WorldGenerationService | null {
    return defaultService;
}

/**
 * 设置默认服务实例
 */
export function setWorldService(service: WorldGenerationService): void {
    defaultService = service;
}

export default WorldGenerationService;
