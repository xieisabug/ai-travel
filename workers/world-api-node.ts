/**
 * 世界生成 API 路由 (Node.js 版本)
 * 
 * 处理世界和旅游相关的 API 请求
 * 使用 SQLite 作为存储后端
 * 支持异步任务队列
 */

import { Hono } from 'hono';
import {
    WorldGenerationService,
    type WorldServiceConfig,
} from '../app/lib/ai/world-service';
import { getStorage } from './storage/sqlite';
import { taskQueue, type Task } from './task-queue';
import { apiLogger } from './logger';
import type {
    World,
    TravelProject,
    GenerateWorldRequest,
} from '../app/types/world';

// ============================================
// 创建 API 路由
// ============================================

const worldApi = new Hono();

// ============================================
// 辅助函数
// ============================================

/**
 * 获取世界生成服务
 */
function getWorldService(): WorldGenerationService {
    const config: WorldServiceConfig = {
        ai: {
            apiKey: process.env.OPENAI_API_KEY || '',
            baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
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

// ============================================
// 任务相关 API
// ============================================

/**
 * 获取任务状态
 * GET /api/tasks/:id
 */
worldApi.get('/tasks/:id', (c) => {
    const { id } = c.req.param();
    const task = taskQueue.getTask(id);

    if (!task) {
        return c.json({ error: 'Task not found' }, 404);
    }

    apiLogger.debug(`查询任务状态: ${id}`, { status: task.status, progress: task.progress });

    return c.json(task);
});

/**
 * 获取所有正在进行的任务
 * GET /api/tasks
 */
worldApi.get('/tasks', (c) => {
    const tasks = taskQueue.getRunningTasks();
    return c.json({ tasks });
});

// ============================================
// 世界 API
// ============================================

/**
 * 获取所有世界列表
 * GET /api/worlds
 */
worldApi.get('/worlds', async (c) => {
    try {
        apiLogger.info('📋 获取世界列表');
        const storage = getStorage();
        const worlds = await storage.getAllWorlds();
        apiLogger.info(`返回 ${worlds.length} 个世界`);

        return c.json({
            worlds: worlds,
        });
    } catch (error) {
        apiLogger.error('获取世界列表失败', error);
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
        apiLogger.info(`🔍 获取世界详情: ${id}`);
        const storage = getStorage();
        const world = await storage.getWorld(id);

        if (!world) {
            apiLogger.warn(`世界不存在: ${id}`);
            return c.json({
                error: 'World not found',
            }, 404);
        }

        return c.json(world);
    } catch (error) {
        apiLogger.error('获取世界详情失败', error);
        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});

/**
 * 生成新世界（异步）
 * POST /api/worlds/generate
 * 
 * 返回任务 ID，客户端通过 GET /api/tasks/:id 查询进度
 */
worldApi.post('/worlds/generate', async (c) => {
    try {
        const body = await c.req.json<GenerateWorldRequest>().catch(() => ({}));

        apiLogger.separator('创建世界生成任务');
        apiLogger.info('📝 请求参数', body);

        // 创建异步任务
        const task = taskQueue.createTask<World>('generate_world', async (updateProgress) => {
            const service = getWorldService();
            const storage = getStorage();

            // 步骤 1: 生成世界描述
            updateProgress({ current: 1, total: 4, message: '正在生成世界描述...' });
            const result = await service.generateWorld(body);

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to generate world description');
            }

            const world = result.data;
            apiLogger.info(`🌍 世界创建成功: ${world.name}`);

            // 步骤 2: 保存初始世界（即使后续失败也能看到）
            updateProgress({ current: 2, total: 4, message: '保存世界数据...' });
            await storage.saveWorld(world);

            // 步骤 3: 生成旅游项目
            updateProgress({ current: 3, total: 4, message: '正在生成旅游项目...' });
            const projectsResult = await service.generateTravelProjects(world);

            if (projectsResult.success) {
                apiLogger.info(`🧭 生成了 ${world.travelProjects.length} 个旅游项目`);
            } else {
                apiLogger.warn('旅游项目生成失败，但世界已保存');
            }

            // 步骤 4: 保存完整世界
            updateProgress({ current: 4, total: 4, message: '完成!' });
            await storage.saveWorld(world);

            return world;
        });

        apiLogger.info(`✅ 任务已创建: ${task.id}`);

        // 立即返回任务信息
        return c.json({
            taskId: task.id,
            status: task.status,
            message: '世界生成任务已创建，请通过任务 ID 查询进度',
        });

    } catch (error) {
        apiLogger.error('创建生成任务失败', error);
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
        apiLogger.info(`🗑️ 删除世界: ${id}`);
        const storage = getStorage();

        await storage.deleteWorld(id);
        apiLogger.info(`世界已删除: ${id}`);

        return c.json({ success: true });
    } catch (error) {
        apiLogger.error('删除世界失败', error);
        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});

// ============================================
// 旅游项目 API
// ============================================

/**
 * 生成项目详情（异步）
 * POST /api/projects/:id/generate
 */
worldApi.post('/projects/:id/generate', async (c) => {
    try {
        const { id } = c.req.param();
        apiLogger.info(`🏗️ 请求生成项目详情: ${id}`);
        const storage = getStorage();

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
            apiLogger.warn(`项目不存在: ${id}`);
            return c.json({
                error: 'Project not found',
            }, 404);
        }

        // 如果已经生成过，直接返回
        if (targetProject.generationStatus === 'ready') {
            apiLogger.info(`项目已生成，直接返回: ${targetProject.name}`);
            return c.json(targetProject);
        }

        // 创建异步任务
        const task = taskQueue.createTask<TravelProject>('generate_project_details', async (updateProgress) => {
            const service = getWorldService();

            updateProgress({ current: 0, total: 3, message: '准备生成项目详情...' });

            // 生成项目详情
            const result = await service.generateProjectDetails(
                targetProject!,
                targetWorld!
            );

            if (!result.success) {
                throw new Error(result.error || 'Failed to generate project details');
            }

            updateProgress({ current: 2, total: 3, message: '保存项目数据...' });
            await storage.saveWorld(targetWorld!);

            updateProgress({ current: 3, total: 3, message: '完成!' });
            return targetProject!;
        });

        apiLogger.info(`✅ 项目生成任务已创建: ${task.id}`);

        return c.json({
            taskId: task.id,
            status: task.status,
            message: '项目详情生成任务已创建',
        });
    } catch (error) {
        apiLogger.error('创建项目生成任务失败', error);
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
        apiLogger.debug(`查询项目: ${id}`);
        const storage = getStorage();

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

        apiLogger.warn(`项目不存在: ${id}`);
        return c.json({
            error: 'Project not found',
        }, 404);
    } catch (error) {
        apiLogger.error('获取项目详情失败', error);
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
        apiLogger.debug(`查询景点: ${projectId}/${spotId}`);
        const storage = getStorage();

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

        apiLogger.warn(`景点不存在: ${spotId}`);
        return c.json({
            error: 'Spot not found',
        }, 404);
    } catch (error) {
        apiLogger.error('获取景点详情失败', error);
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

        const storage = getStorage();
        const service = getWorldService();

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
        const storage = getStorage();

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
        const storage = getStorage();

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
        const storage = getStorage();
        const service = getWorldService();

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
        const storage = getStorage();
        const service = getWorldService();

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

        const storage = getStorage();
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
        message: 'AI Travel World API is running (Node.js)',
        timestamp: new Date().toISOString(),
    });
});

export default worldApi;
