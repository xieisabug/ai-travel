/**
 * 世界生成 API 路由
 * 
 * 处理世界和旅游相关的 API 请求
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
    WorldGenerationService,
    type WorldServiceConfig,
} from '~/lib/ai/world-service';
import { CloudflareKVProvider, type KVNamespace } from './storage/cloudflare-kv';
import type {
    World,
    TravelProject,
    TravelSession,
    GenerateWorldRequest,
} from '~/types/world';

// ============================================
// 环境类型定义
// ============================================

interface Env {
    AI_TRAVEL_KV: KVNamespace;
    OPENAI_API_KEY?: string;
    OPENAI_BASE_URL?: string;
    OPENAI_MODEL?: string;
}

// ============================================
// 创建 API 路由
// ============================================

const worldApi = new Hono<{ Bindings: Env }>();

// 启用 CORS
worldApi.use('/*', cors());

// ============================================
// 辅助函数
// ============================================

/**
 * 获取世界生成服务
 */
function getWorldService(env: Env): WorldGenerationService {
    const config: WorldServiceConfig = {
        ai: {
            apiKey: env.OPENAI_API_KEY || '',
            baseURL: env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
            model: env.OPENAI_MODEL || 'gpt-4o-mini',
        },
        image: {
            // 图片生成配置（留空，由用户实现）
        },
        defaultProjectCount: 3,
        defaultSpotCount: 5,
        defaultNpcPerSpot: 1,
        departureWaitTime: 30000, // 30秒
        cooldownTime: 60000, // 1分钟
    };

    return new WorldGenerationService(config);
}

/**
 * 获取存储提供者
 */
function getStorage(env: Env): CloudflareKVProvider {
    return new CloudflareKVProvider(env.AI_TRAVEL_KV);
}

// ============================================
// 世界 API
// ============================================

/**
 * 获取所有世界列表
 * GET /api/worlds
 */
worldApi.get('/worlds', async (c) => {
    try {
        const storage = getStorage(c.env);
        const worlds = await storage.getAllWorlds();

        return c.json({
            worlds: worlds,
        });
    } catch (error) {
        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});

/**
 * 获取单个世界详情
 * GET /api/worlds/:id
 */
worldApi.get('/worlds/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const storage = getStorage(c.env);
        const world = await storage.getWorld(id);

        if (!world) {
            return c.json({
                error: 'World not found',
            }, 404);
        }

        return c.json(world);
    } catch (error) {
        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});

/**
 * 生成新世界
 * POST /api/worlds/generate
 * 
 * 完整流程：
 * 1. 生成世界基础信息
 * 2. 生成旅游项目列表
 * 3. 为每个项目自动生成详情（景点、NPC、图片）
 */
worldApi.post('/worlds/generate', async (c) => {
    try {
        const body = await c.req.json<GenerateWorldRequest>().catch(() => ({}));
        const service = getWorldService(c.env);
        const storage = getStorage(c.env);

        console.log('[WorldAPI] 开始生成完整世界...');

        // 1. 生成世界基础信息
        console.log('[WorldAPI] Step 1/3: 生成世界基础信息');
        const result = await service.generateWorld(body);

        if (!result.success || !result.data) {
            return c.json({
                error: result.error || 'Failed to generate world',
            }, 500);
        }

        const world = result.data;
        console.log(`[WorldAPI] 世界已创建: ${world.name}`);

        // 2. 生成旅游项目列表
        console.log('[WorldAPI] Step 2/3: 生成旅游项目列表');
        const projectsResult = await service.generateTravelProjects(world);

        if (!projectsResult.success) {
            // 即使项目生成失败，也保存世界
            console.warn('[WorldAPI] 项目生成失败，仅保存世界基础信息');
            await storage.saveWorld(world);
            return c.json(world);
        }

        console.log(`[WorldAPI] 生成了 ${world.travelProjects.length} 个旅游项目`);

        // 3. 为每个项目自动生成详情（并发执行）
        console.log('[WorldAPI] Step 3/3: 为所有项目生成详情（景点、NPC、图片）');
        const detailsPromises = world.travelProjects.map(async (project, index) => {
            console.log(`[WorldAPI] 开始生成项目 ${index + 1}/${world.travelProjects.length}: ${project.name}`);
            try {
                const detailResult = await service.generateProjectDetails(project, world);
                if (detailResult.success) {
                    console.log(`[WorldAPI] 项目 ${project.name} 详情生成完成`);
                } else {
                    console.warn(`[WorldAPI] 项目 ${project.name} 详情生成失败: ${detailResult.error}`);
                }
            } catch (err) {
                console.error(`[WorldAPI] 项目 ${project.name} 详情生成异常:`, err);
            }
        });

        // 等待所有项目详情生成完成
        await Promise.all(detailsPromises);

        // 保存完整的世界数据
        console.log('[WorldAPI] 保存完整世界数据...');
        await storage.saveWorld(world);

        console.log(`[WorldAPI] ✨ 世界 ${world.name} 生成完毕！`);
        return c.json(world);
    } catch (error) {
        console.error('[WorldAPI] 生成世界失败:', error);
        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});

/**
 * 删除世界
 * DELETE /api/worlds/:id
 */
worldApi.delete('/worlds/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const storage = getStorage(c.env);

        await storage.deleteWorld(id);

        return c.json({ success: true });
    } catch (error) {
        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});

// ============================================
// 旅游项目 API
// ============================================

/**
 * 生成项目详情（选择项目后调用）
 * POST /api/projects/:id/generate
 */
worldApi.post('/projects/:id/generate', async (c) => {
    try {
        const { id } = c.req.param();
        const storage = getStorage(c.env);
        const service = getWorldService(c.env);

        // 查找项目
        const worlds = await storage.getAllWorlds();
        let targetProject: TravelProject | null = null;
        let targetWorld: World | null = null;

        for (const world of worlds) {
            const project = world.travelProjects.find(p => p.id === id);
            if (project) {
                targetProject = project;
                targetWorld = world;
                break;
            }
        }

        if (!targetProject || !targetWorld) {
            return c.json({
                error: 'Project not found',
            }, 404);
        }

        // 如果已经生成过，直接返回
        if (targetProject.generationStatus === 'ready') {
            return c.json(targetProject);
        }

        // 生成项目详情
        const result = await service.generateProjectDetails(
            targetProject,
            targetWorld
        );

        if (!result.success) {
            return c.json({
                error: result.error || 'Failed to generate project details',
            }, 500);
        }

        // 保存更新后的世界
        await storage.saveWorld(targetWorld);

        return c.json(targetProject);
    } catch (error) {
        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});

/**
 * 获取项目详情
 * GET /api/projects/:id
 */
worldApi.get('/projects/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const storage = getStorage(c.env);

        const worlds = await storage.getAllWorlds();

        for (const world of worlds) {
            const project = world.travelProjects.find(p => p.id === id);
            if (project) {
                return c.json({
                    project,
                    world: {
                        id: world.id,
                        name: world.name,
                        description: world.description,
                    },
                });
            }
        }

        return c.json({
            error: 'Project not found',
        }, 404);
    } catch (error) {
        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});

/**
 * 获取项目景点详情
 * GET /api/projects/:projectId/spots/:spotId
 */
worldApi.get('/projects/:projectId/spots/:spotId', async (c) => {
    try {
        const { projectId, spotId } = c.req.param();
        const storage = getStorage(c.env);

        const worlds = await storage.getAllWorlds();

        for (const world of worlds) {
            const project = world.travelProjects.find(p => p.id === projectId);
            if (project) {
                const spot = project.spots.find(s => s.id === spotId);
                if (spot) {
                    return c.json(spot);
                }
            }
        }

        return c.json({
            error: 'Spot not found',
        }, 404);
    } catch (error) {
        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});

// ============================================
// 旅游会话 API
// ============================================

/**
 * 开始旅游（创建会话）
 * POST /api/sessions
 */
worldApi.post('/sessions', async (c) => {
    try {
        const body = await c.req.json<{
            projectId: string;
            playerName: string;
            playerCharacteristics?: string[];
        }>();

        const storage = getStorage(c.env);
        const service = getWorldService(c.env);

        // 查找项目对应的世界
        const worlds = await storage.getAllWorlds();
        let targetProject: TravelProject | null = null;
        let targetWorld: World | null = null;

        for (const world of worlds) {
            const project = world.travelProjects.find(p => p.id === body.projectId);
            if (project) {
                targetProject = project;
                targetWorld = world;
                break;
            }
        }

        if (!targetProject || !targetWorld) {
            return c.json({
                error: 'Project not found',
            }, 404);
        }

        // 如果项目未生成详情，先生成
        if (targetProject.generationStatus !== 'ready') {
            const genResult = await service.generateProjectDetails(targetProject, targetWorld);
            if (!genResult.success) {
                return c.json({
                    error: 'Failed to generate project details',
                }, 500);
            }
            await storage.saveWorld(targetWorld);
        }

        // 生成玩家 ID
        const playerId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        // 创建会话
        const session = service.createTravelSession(playerId, targetWorld, targetProject);
        await storage.saveSession(session);

        return c.json(session);
    } catch (error) {
        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});

/**
 * 获取玩家的所有会话
 * GET /api/sessions/player/:playerId
 */
worldApi.get('/sessions/player/:playerId', async (c) => {
    try {
        const { playerId } = c.req.param();
        const storage = getStorage(c.env);

        const sessions = await storage.getPlayerSessions(playerId);

        return c.json({ sessions });
    } catch (error) {
        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});

/**
 * 获取会话详情
 * GET /api/sessions/:id
 */
worldApi.get('/sessions/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const storage = getStorage(c.env);

        const session = await storage.getSession(id);

        if (!session) {
            return c.json({
                error: 'Session not found',
            }, 404);
        }

        return c.json(session);
    } catch (error) {
        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});

/**
 * 更新会话（前往下一个景点）
 * POST /api/sessions/:id/next-spot
 */
worldApi.post('/sessions/:id/next-spot', async (c) => {
    try {
        const { id } = c.req.param();
        const storage = getStorage(c.env);
        const service = getWorldService(c.env);

        // 获取会话
        const session = await storage.getSession(id);
        if (!session) {
            return c.json({
                error: 'Session not found',
            }, 404);
        }

        // 获取世界和项目
        const world = await storage.getWorld(session.worldId);
        if (!world) {
            return c.json({
                error: 'World not found',
            }, 404);
        }

        const project = world.travelProjects.find(p => p.id === session.projectId);
        if (!project) {
            return c.json({
                error: 'Project not found',
            }, 404);
        }

        // 开始探索或前往下一个景点
        if (session.status === 'departing' || session.status === 'preparing') {
            service.startExploring(session, project);
        } else {
            const nextSpot = service.moveToNextSpot(session, project);

            if (!nextSpot && session.status === 'returning') {
                // 已完成所有景点，返回完成标记
                await storage.saveSession(session);
                return c.json({
                    completed: true,
                    session,
                });
            }
        }

        // 保存更新后的会话
        await storage.saveSession(session);

        // 获取当前景点
        const currentSpot = project.spots.find(s => s.id === session.currentSpotId);

        return c.json({
            session,
            spot: currentSpot,
        });
    } catch (error) {
        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});

/**
 * 完成旅游
 * POST /api/sessions/:id/complete
 */
worldApi.post('/sessions/:id/complete', async (c) => {
    try {
        const { id } = c.req.param();
        const storage = getStorage(c.env);
        const service = getWorldService(c.env);

        const session = await storage.getSession(id);
        if (!session) {
            return c.json({
                error: 'Session not found',
            }, 404);
        }

        service.completeTravel(session);
        await storage.saveSession(session);

        return c.json(session);
    } catch (error) {
        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});

/**
 * 添加回忆
 * POST /api/sessions/:id/memories
 */
worldApi.post('/sessions/:id/memories', async (c) => {
    try {
        const { id } = c.req.param();
        const body = await c.req.json<{
            spotId: string;
            title: string;
            description: string;
            image?: string;
        }>();

        const storage = getStorage(c.env);
        const session = await storage.getSession(id);

        if (!session) {
            return c.json({
                error: 'Session not found',
            }, 404);
        }

        // 添加回忆
        session.memories.push({
            id: `memory_${Date.now()}`,
            spotId: body.spotId,
            title: body.title,
            description: body.description,
            image: body.image,
            capturedAt: new Date().toISOString(),
        });

        session.updatedAt = new Date().toISOString();
        await storage.saveSession(session);

        return c.json(session);
    } catch (error) {
        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});

// ============================================
// 健康检查
// ============================================

worldApi.get('/health', (c) => {
    return c.json({
        success: true,
        message: 'AI Travel World API is running',
        timestamp: new Date().toISOString(),
    });
});

export default worldApi;
