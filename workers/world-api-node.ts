/**
 * 世界生成 API 路由 (Node.js 版本)
 * 
 * 处理世界和旅游相关的 API 请求
 * 使用 SQLite 作为存储后端
 * 支持异步任务队列
 */

import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import {
    WorldGenerationService,
    type WorldServiceConfig,
} from '../app/lib/ai/world-service';
import { ai_generate_npc_dialog, type DialogLine } from '../app/lib/ai/generate';
import { getStorage } from './storage/sqlite';
import { taskQueue, type Task } from './task-queue';
import { apiLogger } from './logger';
import { configureAICallRecorder } from '../app/lib/ai/ai-call-recorder';
import {
    hashPassword,
    verifyPassword,
    generateUserId,
    createUserSession,
    isSessionExpired,
    toCurrentUser,
    validateUsername,
    validateEmail,
    validatePassword,
    getTodayDateString,
    shouldResetStats,
} from './auth';
import type {
    World,
    TravelProject,
    GenerateWorldRequest,
    Spot,
    SpotNPC,
    DialogScript,
    DialogScriptType,
} from '../app/types/world';
import { toNPCPublicProfile } from '../app/types/world';
import type {
    User,
    LoginRequest,
    RegisterRequest,
    CurrentUser,
    UserRole,
} from '../app/types/user';
import { ROLE_PERMISSIONS } from '../app/types/user';
import qiniuPkg from 'qiniu';
// 兼容 ESM 默认导出
const qiniu: any = (qiniuPkg as any).default || qiniuPkg;

// 配置 AI 调用记录器
configureAICallRecorder({
    enabled: true,
    onSave: async (record) => {
        const storage = getStorage();
        await storage.saveAICall(record);
    },
});

// ============================================
// 创建 API 路由
// ============================================

const worldApi = new Hono();

// ============================================
// 辅助函数
// ============================================

/** Cookie 名称 */
const AUTH_COOKIE_NAME = 'ai_travel_token';
/** Cookie 有效期（7天） */
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

/** 简单 ID 生成 */
function generateId(prefix: string = ''): string {
    return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 从请求中获取当前用户
 */
async function getCurrentUserFromRequest(c: any): Promise<CurrentUser | null> {
    const token = getCookie(c, AUTH_COOKIE_NAME);
    if (!token) return null;

    const storage = getStorage();
    const session = await storage.getUserSessionByToken(token);
    if (!session || isSessionExpired(session)) {
        if (session) {
            await storage.deleteUserSession(session.id);
        }
        return null;
    }

    const user = await storage.getUser(session.userId);
    if (!user || !user.isActive) return null;

    // 检查是否需要重置统计
    if (shouldResetStats(user)) {
        user.todayWorldGenerationCount = 0;
        user.statsResetDate = getTodayDateString();
        user.updatedAt = new Date().toISOString();
        await storage.saveUser(user);
    }

    return toCurrentUser(user);
}

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

async function preGenerateDialogScriptsForProject(
    project: TravelProject,
    world: World,
    storage: ReturnType<typeof getStorage>
): Promise<void> {
    const config = {
        apiKey: process.env.OPENAI_API_KEY || '',
        baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    };

    const dialogTypes: DialogScriptType[] = ['entry', 'chat'];

    for (const spot of project.spots) {
        for (const npc of spot.npcs) {
            for (const dialogType of dialogTypes) {
                const existing = await storage.getDialogScripts({
                    npcId: npc.id,
                    spotId: spot.id,
                    type: dialogType,
                    isActive: true,
                    limit: 1,
                });

                if (existing.length > 0) {
                    continue;
                }

                const result = await ai_generate_npc_dialog(
                    {
                        npc,
                        spot,
                        world,
                        dialogType,
                    },
                    config
                );

                if (result.success && result.data) {
                    const script: DialogScript = {
                        id: generateId('dlg_'),
                        npcId: npc.id,
                        spotId: spot.id,
                        type: dialogType,
                        lines: result.data,
                        condition: undefined,
                        order: 0,
                        isActive: true,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    await storage.saveDialogScript(script);
                    apiLogger.info(`🗂️ 预生成对话脚本 ${script.id} (${dialogType})`);
                } else {
                    apiLogger.warn(`预生成对话失败: ${npc.name} (${dialogType})`, result.error);
                }
            }
        }
    }
}

// ============================================
// 七牛云上传辅助
// ============================================

type QiniuZoneKey = 'z0' | 'z1' | 'z2' | 'na0' | 'as0';

interface QiniuUploadConfig {
    accessKey: string;
    secretKey: string;
    bucket: string;
    publicDomain: string;
    keyPrefix: string;
    zone?: QiniuZoneKey;
}

function resolveQiniuZone(zone?: QiniuZoneKey) {
    if (!zone) return undefined;

    const zoneMap: Record<QiniuZoneKey, unknown> = {
        z0: qiniu.zone.Zone_z0,
        z1: qiniu.zone.Zone_z1,
        z2: qiniu.zone.Zone_z2,
        na0: qiniu.zone.Zone_na0,
        as0: qiniu.zone.Zone_as0,
    };

    return zoneMap[zone];
}

function getQiniuConfig(): QiniuUploadConfig | null {
    const accessKey = process.env.QINIU_ACCESS_KEY;
    const secretKey = process.env.QINIU_SECRET_KEY;
    const bucket = process.env.QINIU_BUCKET;
    const publicDomain = process.env.QINIU_PUBLIC_DOMAIN?.replace(/\/$/, '');
    const keyPrefixEnv = process.env.QINIU_KEY_PREFIX || 'uploads/';
    const normalizedPrefix = keyPrefixEnv.replace(/^\//, '');
    const keyPrefix = normalizedPrefix.endsWith('/') ? normalizedPrefix : `${normalizedPrefix}/`;
    const zone = process.env.QINIU_ZONE as QiniuZoneKey | undefined;

    if (!accessKey || !secretKey || !bucket || !publicDomain) {
        return null;
    }

    return {
        accessKey,
        secretKey,
        bucket,
        publicDomain,
        keyPrefix,
        zone,
    };
}

async function uploadToQiniu(fileName: string, buffer: Buffer, mimeType: string): Promise<string> {
    const config = getQiniuConfig();

    if (!config) {
        throw new Error('七牛云未配置，请设置 QINIU_ACCESS_KEY、QINIU_SECRET_KEY、QINIU_BUCKET、QINIU_PUBLIC_DOMAIN');
    }

    const mac = new qiniu.auth.digest.Mac(config.accessKey, config.secretKey);
    const putPolicy = new qiniu.rs.PutPolicy({ scope: config.bucket });
    const uploadToken = putPolicy.uploadToken(mac);

    const qiniuConfig = new qiniu.conf.Config();
    qiniuConfig.useHttpsDomain = true;
    const zone = resolveQiniuZone(config.zone);
    if (zone) {
        // @ts-expect-error qiniu 类型定义较旧，运行时可用
        qiniuConfig.zone = zone;
    }

    const formUploader = new qiniu.form_up.FormUploader(qiniuConfig);
    const putExtra = new qiniu.form_up.PutExtra();
    putExtra.mimeType = mimeType || 'application/octet-stream';

    const key = `${config.keyPrefix}${fileName}`;

    await new Promise<void>((resolve, reject) => {
        formUploader.put(uploadToken, key, buffer, putExtra, (err, _body, info) => {
            if (err) return reject(err);
            if (!info || info.statusCode !== 200) {
                const errorMessage = (info as any)?.data?.error || '上传失败';
                return reject(new Error(`七牛云上传失败: ${info?.statusCode || 'unknown'} ${errorMessage}`));
            }
            resolve();
        });
    });

    return `${config.publicDomain}/${key}`;
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
 * 需要管理员权限
 */
worldApi.post('/worlds/generate', async (c) => {
    try {
        // 权限检查：需要登录且有生成世界权限
        const currentUser = await getCurrentUserFromRequest(c);
        if (!currentUser) {
            return c.json({ error: '请先登录' }, 401);
        }

        if (!currentUser.permissions.canGenerateWorld) {
            return c.json({ error: '您没有生成世界的权限，请升级到 Pro 会员' }, 403);
        }

        // 检查每日生成限制
        const dailyLimit = currentUser.permissions.dailyWorldGenerationLimit;
        if (dailyLimit !== -1 && currentUser.todayWorldGenerationCount >= dailyLimit) {
            return c.json({
                error: `您今日的世界生成次数已用完（${dailyLimit}次/天），请明天再试或升级会员`
            }, 403);
        }

        const body = await c.req.json<GenerateWorldRequest>().catch(() => ({}));

        apiLogger.separator('创建世界生成任务');
        apiLogger.info('📝 请求参数', body);
        apiLogger.info(`👤 操作用户: ${currentUser.username} (${currentUser.role})`);

        // 更新用户的生成次数统计（在创建任务前立即更新，防止并发问题）
        const storage = getStorage();
        await storage.updateUserStats(
            currentUser.id,
            currentUser.todayWorldGenerationCount + 1,
            getTodayDateString()
        );

        // 创建异步任务
        const task = taskQueue.createTask<World>('generate_world', async (updateProgress) => {
            const service = getWorldService();

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

            updateProgress({ current: 0, total: 4, message: '准备生成项目详情...' });

            // 生成项目详情
            const result = await service.generateProjectDetails(
                targetProject!,
                targetWorld!
            );

            if (!result.success) {
                throw new Error(result.error || 'Failed to generate project details');
            }

            // 预生成 NPC 对话脚本并存储
            updateProgress({ current: 2, total: 4, message: '预生成 NPC 对话...' });
            await preGenerateDialogScriptsForProject(targetProject!, targetWorld!, storage);

            updateProgress({ current: 3, total: 4, message: '保存项目数据...' });
            await storage.saveWorld(targetWorld!);

            updateProgress({ current: 4, total: 4, message: '完成!' });
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
 *
 * 返回的 NPC 数据已过滤敏感信息（personality, backstory, speakingStyle, interests）
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
                    // 过滤 NPC 敏感数据
                    const filteredSpot = {
                        ...spot,
                        npcs: spot.npcs.map(npc => toNPCPublicProfile(npc)),
                    };
                    return c.json(filteredSpot);
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

        // 获取当前景点（过滤 NPC 敏感数据）
        const currentSpot = project.spots.find(s => s.id === session.currentSpotId);
        const filteredSpot = currentSpot ? {
            ...currentSpot,
            npcs: currentSpot.npcs.map(npc => toNPCPublicProfile(npc)),
        } : undefined;

        return c.json({
            session,
            spot: filteredSpot,
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
// 用户认证 API
// ============================================

/**
 * 用户注册
 * POST /api/auth/register
 */
worldApi.post('/auth/register', async (c) => {
    try {
        const body = await c.req.json<RegisterRequest>();
        apiLogger.info('📝 用户注册请求', { username: body.username, email: body.email });

        // 验证输入
        const usernameValidation = validateUsername(body.username);
        if (!usernameValidation.valid) {
            return c.json({ success: false, error: usernameValidation.error }, 400);
        }

        const emailValidation = validateEmail(body.email);
        if (!emailValidation.valid) {
            return c.json({ success: false, error: emailValidation.error }, 400);
        }

        const passwordValidation = validatePassword(body.password);
        if (!passwordValidation.valid) {
            return c.json({ success: false, error: passwordValidation.error }, 400);
        }

        const storage = getStorage();

        // 检查用户名是否已存在
        const existingByUsername = await storage.getUserByUsername(body.username);
        if (existingByUsername) {
            return c.json({ success: false, error: '用户名已被使用' }, 400);
        }

        // 检查邮箱是否已存在
        const existingByEmail = await storage.getUserByEmail(body.email);
        if (existingByEmail) {
            return c.json({ success: false, error: '邮箱已被注册' }, 400);
        }

        // 创建用户
        const now = new Date().toISOString();
        const user: User = {
            id: generateUserId(),
            username: body.username,
            displayName: body.displayName || body.username,
            email: body.email,
            passwordHash: hashPassword(body.password),
            role: 'free',
            isActive: true,
            currencyBalance: 0,
            todayWorldGenerationCount: 0,
            statsResetDate: getTodayDateString(),
            createdAt: now,
            updatedAt: now,
        };

        await storage.saveUser(user);
        apiLogger.info(`✅ 用户注册成功: ${user.username} (${user.id})`);

        // 创建会话
        const userAgent = c.req.header('user-agent');
        const session = createUserSession(user.id, userAgent);
        await storage.saveUserSession(session);

        // 设置 Cookie
        setCookie(c, AUTH_COOKIE_NAME, session.token, {
            httpOnly: true,
            secure: false, // 开发环境使用 http
            sameSite: 'Lax',
            maxAge: COOKIE_MAX_AGE,
            path: '/',
        });

        return c.json({
            success: true,
            user: toCurrentUser(user),
            token: session.token,
        });
    } catch (error) {
        apiLogger.error('用户注册失败', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : '注册失败',
        }, 500);
    }
});

/**
 * 用户登录
 * POST /api/auth/login
 */
worldApi.post('/auth/login', async (c) => {
    try {
        const body = await c.req.json<LoginRequest>();
        apiLogger.info('🔐 用户登录请求', { usernameOrEmail: body.usernameOrEmail });

        if (!body.usernameOrEmail || !body.password) {
            return c.json({ success: false, error: '请输入用户名/邮箱和密码' }, 400);
        }

        const storage = getStorage();
        const user = await storage.getUserByUsernameOrEmail(body.usernameOrEmail);

        if (!user) {
            return c.json({ success: false, error: '用户名或密码错误' }, 401);
        }

        if (!user.isActive) {
            return c.json({ success: false, error: '账户已被禁用' }, 403);
        }

        if (!verifyPassword(body.password, user.passwordHash || '')) {
            return c.json({ success: false, error: '用户名或密码错误' }, 401);
        }

        // 检查是否需要重置统计
        if (shouldResetStats(user)) {
            user.todayWorldGenerationCount = 0;
            user.statsResetDate = getTodayDateString();
        }

        // 更新最后登录时间
        user.lastLoginAt = new Date().toISOString();
        user.updatedAt = new Date().toISOString();
        await storage.saveUser(user);

        // 尝试领取每日登录奖励
        const dailyClaimResult = await storage.claimDailyBonus(user.id);
        if (dailyClaimResult.claimed) {
            // 重新获取用户以获得最新余额
            const updatedUser = await storage.getUser(user.id);
            if (updatedUser) {
                user.currencyBalance = updatedUser.currencyBalance;
                user.lastDailyClaimDate = updatedUser.lastDailyClaimDate;
            }
            apiLogger.info(`💰 用户 ${user.username} 领取每日奖励: ${dailyClaimResult.amount} 远方币`);
        }

        // 创建会话
        const userAgent = c.req.header('user-agent');
        const session = createUserSession(user.id, userAgent);
        await storage.saveUserSession(session);

        apiLogger.info(`✅ 用户登录成功: ${user.username}`);

        // 设置 Cookie
        setCookie(c, AUTH_COOKIE_NAME, session.token, {
            httpOnly: true,
            secure: false,
            sameSite: 'Lax',
            maxAge: COOKIE_MAX_AGE,
            path: '/',
        });

        return c.json({
            success: true,
            user: toCurrentUser(user),
            token: session.token,
            dailyRewardClaimed: dailyClaimResult.claimed,
            dailyRewardAmount: dailyClaimResult.claimed ? dailyClaimResult.amount : undefined,
        });
    } catch (error) {
        apiLogger.error('用户登录失败', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : '登录失败',
        }, 500);
    }
});

/**
 * 用户登出
 * POST /api/auth/logout
 */
worldApi.post('/auth/logout', async (c) => {
    try {
        const token = getCookie(c, AUTH_COOKIE_NAME);
        if (token) {
            const storage = getStorage();
            const session = await storage.getUserSessionByToken(token);
            if (session) {
                await storage.deleteUserSession(session.id);
            }
        }

        deleteCookie(c, AUTH_COOKIE_NAME, { path: '/' });

        return c.json({ success: true });
    } catch (error) {
        apiLogger.error('用户登出失败', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : '登出失败',
        }, 500);
    }
});

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
worldApi.get('/auth/me', async (c) => {
    try {
        const currentUser = await getCurrentUserFromRequest(c);
        if (!currentUser) {
            return c.json({ success: false, error: '未登录' }, 401);
        }

        return c.json({
            success: true,
            user: currentUser,
        });
    } catch (error) {
        apiLogger.error('获取当前用户信息失败', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : '获取用户信息失败',
        }, 500);
    }
});

/**
 * 修改密码
 * POST /api/auth/change-password
 */
worldApi.post('/auth/change-password', async (c) => {
    try {
        const currentUser = await getCurrentUserFromRequest(c);
        if (!currentUser) {
            return c.json({ success: false, error: '未登录' }, 401);
        }

        const body = await c.req.json<{ oldPassword: string; newPassword: string }>();

        const passwordValidation = validatePassword(body.newPassword);
        if (!passwordValidation.valid) {
            return c.json({ success: false, error: passwordValidation.error }, 400);
        }

        const storage = getStorage();
        const user = await storage.getUser(currentUser.id);
        if (!user) {
            return c.json({ success: false, error: '用户不存在' }, 404);
        }

        if (!verifyPassword(body.oldPassword, user.passwordHash || '')) {
            return c.json({ success: false, error: '原密码错误' }, 400);
        }

        user.passwordHash = hashPassword(body.newPassword);
        user.updatedAt = new Date().toISOString();
        await storage.saveUser(user);

        // 登出所有其他会话
        await storage.deleteUserSessionsByUserId(user.id);

        // 创建新会话
        const userAgent = c.req.header('user-agent');
        const session = createUserSession(user.id, userAgent);
        await storage.saveUserSession(session);

        setCookie(c, AUTH_COOKIE_NAME, session.token, {
            httpOnly: true,
            secure: false,
            sameSite: 'Lax',
            maxAge: COOKIE_MAX_AGE,
            path: '/',
        });

        apiLogger.info(`✅ 用户修改密码成功: ${user.username}`);

        return c.json({ success: true, token: session.token });
    } catch (error) {
        apiLogger.error('修改密码失败', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : '修改密码失败',
        }, 500);
    }
});

// ============================================
// 用户管理 API (管理员)
// ============================================

/**
 * 获取用户列表 (管理员)
 * GET /api/admin/users
 */
worldApi.get('/admin/users', async (c) => {
    try {
        const currentUser = await getCurrentUserFromRequest(c);
        if (!currentUser) {
            return c.json({ success: false, error: '未登录' }, 401);
        }

        if (!currentUser.permissions.canViewAllUsers) {
            return c.json({ success: false, error: '无权限' }, 403);
        }

        const params = {
            page: parseInt(c.req.query('page') || '1'),
            pageSize: parseInt(c.req.query('pageSize') || '20'),
            search: c.req.query('search'),
            role: c.req.query('role') as UserRole | undefined,
            isActive: c.req.query('isActive') ? c.req.query('isActive') === 'true' : undefined,
        };

        const storage = getStorage();
        const result = await storage.getAllUsers(params);

        return c.json({
            success: true,
            ...result,
            page: params.page,
            pageSize: params.pageSize,
        });
    } catch (error) {
        apiLogger.error('获取用户列表失败', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : '获取用户列表失败',
        }, 500);
    }
});

/**
 * 更新用户角色 (管理员)
 * PUT /api/admin/users/:id/role
 */
worldApi.put('/admin/users/:id/role', async (c) => {
    try {
        const currentUser = await getCurrentUserFromRequest(c);
        if (!currentUser) {
            return c.json({ success: false, error: '未登录' }, 401);
        }

        if (!currentUser.permissions.canManageUsers) {
            return c.json({ success: false, error: '无权限' }, 403);
        }

        const { id } = c.req.param();
        const body = await c.req.json<{ role: UserRole }>();

        if (!['free', 'pro', 'pro_plus', 'admin'].includes(body.role)) {
            return c.json({ success: false, error: '无效的用户角色' }, 400);
        }

        // 不能修改自己的角色
        if (id === currentUser.id) {
            return c.json({ success: false, error: '不能修改自己的角色' }, 400);
        }

        const storage = getStorage();
        const user = await storage.getUser(id);
        if (!user) {
            return c.json({ success: false, error: '用户不存在' }, 404);
        }

        user.role = body.role;
        user.updatedAt = new Date().toISOString();
        await storage.saveUser(user);

        apiLogger.info(`✅ 管理员 ${currentUser.username} 将用户 ${user.username} 的角色修改为 ${body.role}`);

        return c.json({ success: true });
    } catch (error) {
        apiLogger.error('更新用户角色失败', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : '更新用户角色失败',
        }, 500);
    }
});

/**
 * 禁用/启用用户 (管理员)
 * PUT /api/admin/users/:id/status
 */
worldApi.put('/admin/users/:id/status', async (c) => {
    try {
        const currentUser = await getCurrentUserFromRequest(c);
        if (!currentUser) {
            return c.json({ success: false, error: '未登录' }, 401);
        }

        if (!currentUser.permissions.canManageUsers) {
            return c.json({ success: false, error: '无权限' }, 403);
        }

        const { id } = c.req.param();
        const body = await c.req.json<{ isActive: boolean }>();

        // 不能禁用自己
        if (id === currentUser.id) {
            return c.json({ success: false, error: '不能禁用自己的账户' }, 400);
        }

        const storage = getStorage();
        const user = await storage.getUser(id);
        if (!user) {
            return c.json({ success: false, error: '用户不存在' }, 404);
        }

        user.isActive = body.isActive;
        user.updatedAt = new Date().toISOString();
        await storage.saveUser(user);

        // 如果禁用用户，删除其所有会话
        if (!body.isActive) {
            await storage.deleteUserSessionsByUserId(id);
        }

        apiLogger.info(`✅ 管理员 ${currentUser.username} ${body.isActive ? '启用' : '禁用'} 了用户 ${user.username}`);

        return c.json({ success: true });
    } catch (error) {
        apiLogger.error('更新用户状态失败', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : '更新用户状态失败',
        }, 500);
    }
});

// ============================================
// 对话脚本管理 API (管理员)
// ============================================

worldApi.get('/admin/dialog-scripts', async (c) => {
    const currentUser = await getCurrentUserFromRequest(c);
    if (!currentUser) return c.json({ success: false, error: '未登录' }, 401);
    if (currentUser.role !== 'admin') return c.json({ success: false, error: '无权限' }, 403);

    const npcId = c.req.query('npcId');
    const spotId = c.req.query('spotId');
    const type = c.req.query('type') as DialogScriptType | undefined;

    const storage = getStorage();
    const scripts = await storage.getDialogScripts({ npcId: npcId || undefined, spotId: spotId || undefined, type });

    return c.json({ success: true, scripts });
});

worldApi.post('/admin/dialog-scripts', async (c) => {
    const currentUser = await getCurrentUserFromRequest(c);
    if (!currentUser) return c.json({ success: false, error: '未登录' }, 401);
    if (currentUser.role !== 'admin') return c.json({ success: false, error: '无权限' }, 403);

    const body = await c.req.json<Omit<DialogScript, 'id' | 'createdAt' | 'updatedAt'>>();

    const script: DialogScript = {
        ...body,
        id: generateId('dlg_'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const storage = getStorage();
    await storage.saveDialogScript(script);

    apiLogger.info(`✅ 管理员 ${currentUser.username} 创建对话脚本 ${script.id}`);

    return c.json({ success: true, script });
});

worldApi.put('/admin/dialog-scripts/:id', async (c) => {
    const currentUser = await getCurrentUserFromRequest(c);
    if (!currentUser) return c.json({ success: false, error: '未登录' }, 401);
    if (currentUser.role !== 'admin') return c.json({ success: false, error: '无权限' }, 403);

    const { id } = c.req.param();
    const body = await c.req.json<DialogScript>();

    const storage = getStorage();
    const existing = await storage.getDialogScript(id);
    if (!existing) {
        return c.json({ success: false, error: '脚本不存在' }, 404);
    }

    const script: DialogScript = {
        ...existing,
        ...body,
        id,
        updatedAt: new Date().toISOString(),
    };

    await storage.saveDialogScript(script);

    apiLogger.info(`✅ 管理员 ${currentUser.username} 更新对话脚本 ${id}`);

    return c.json({ success: true, script });
});

worldApi.delete('/admin/dialog-scripts/:id', async (c) => {
    const currentUser = await getCurrentUserFromRequest(c);
    if (!currentUser) return c.json({ success: false, error: '未登录' }, 401);
    if (currentUser.role !== 'admin') return c.json({ success: false, error: '无权限' }, 403);

    const { id } = c.req.param();
    const storage = getStorage();
    await storage.deleteDialogScript(id);

    apiLogger.info(`✅ 管理员 ${currentUser.username} 删除对话脚本 ${id}`);

    return c.json({ success: true });
});

// ============================================
// 世界管理 API (管理员)
// ============================================

/**
 * 更新世界 (管理员)
 * PUT /api/admin/worlds/:id
 */
worldApi.put('/admin/worlds/:id', async (c) => {
    try {
        const currentUser = await getCurrentUserFromRequest(c);
        if (!currentUser) {
            return c.json({ success: false, error: '未登录' }, 401);
        }

        if (currentUser.role !== 'admin') {
            return c.json({ success: false, error: '无权限' }, 403);
        }

        const { id } = c.req.param();
        const body = await c.req.json<World>();

        const storage = getStorage();
        const existingWorld = await storage.getWorld(id);
        if (!existingWorld) {
            return c.json({ success: false, error: '世界不存在' }, 404);
        }

        // 更新世界数据
        const updatedWorld: World = {
            ...body,
            id, // 确保 ID 不变
            createdAt: existingWorld.createdAt, // 保留创建时间
        };

        await storage.saveWorld(updatedWorld);

        apiLogger.info(`✅ 管理员 ${currentUser.username} 更新了世界: ${updatedWorld.name}`);

        return c.json({ success: true, world: updatedWorld });
    } catch (error) {
        apiLogger.error('更新世界失败', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : '更新世界失败',
        }, 500);
    }
});

/**
 * 上传图片 (管理员)
 * POST /api/upload
 */
worldApi.post('/upload', async (c) => {
    try {
        const currentUser = await getCurrentUserFromRequest(c);
        if (!currentUser) {
            return c.json({ success: false, error: '未登录' }, 401);
        }

        if (currentUser.role !== 'admin') {
            return c.json({ success: false, error: '无权限' }, 403);
        }

        const formData = await c.req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return c.json({ success: false, error: '未提供文件' }, 400);
        }

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            return c.json({ success: false, error: '只能上传图片文件' }, 400);
        }

        // 验证文件大小 (最大 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return c.json({ success: false, error: '文件大小不能超过 10MB' }, 400);
        }

        // 生成文件名
        const ext = file.name.split('.').pop() || 'png';
        const fileName = `upload_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const url = await uploadToQiniu(fileName, buffer, file.type);

        apiLogger.info(`✅ 管理员 ${currentUser.username} 上传了图片到七牛云: ${fileName}`);

        return c.json({ success: true, url });
    } catch (error) {
        apiLogger.error('上传图片失败', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : '上传图片失败',
        }, 500);
    }
});

// ============================================
// 货币 API
// ============================================

/**
 * 获取当前用户货币余额
 * GET /api/currency/balance
 */
worldApi.get('/currency/balance', async (c) => {
    try {
        const currentUser = await getCurrentUserFromRequest(c);
        if (!currentUser) {
            return c.json({ success: false, error: '请先登录' }, 401);
        }

        const storage = getStorage();
        const user = await storage.getUser(currentUser.id);

        return c.json({
            success: true,
            balance: user?.currencyBalance || 0,
        });
    } catch (error) {
        apiLogger.error('获取余额失败', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : '获取余额失败',
        }, 500);
    }
});

/**
 * 获取当前用户交易记录
 * GET /api/currency/transactions
 */
worldApi.get('/currency/transactions', async (c) => {
    try {
        const currentUser = await getCurrentUserFromRequest(c);
        if (!currentUser) {
            return c.json({ success: false, error: '请先登录' }, 401);
        }

        const limit = parseInt(c.req.query('limit') || '20');
        const offset = parseInt(c.req.query('offset') || '0');

        const storage = getStorage();
        const result = await storage.getCurrencyTransactions(currentUser.id, limit, offset);

        return c.json({
            success: true,
            transactions: result.transactions,
            total: result.total,
        });
    } catch (error) {
        apiLogger.error('获取交易记录失败', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : '获取交易记录失败',
        }, 500);
    }
});

/**
 * 更新用户资料 (昵称、头像)
 * PUT /api/auth/profile
 */
worldApi.put('/auth/profile', async (c) => {
    try {
        const currentUser = await getCurrentUserFromRequest(c);
        if (!currentUser) {
            return c.json({ success: false, error: '请先登录' }, 401);
        }

        const body = await c.req.json<{ displayName?: string; avatar?: string }>();
        const storage = getStorage();
        const user = await storage.getUser(currentUser.id);

        if (!user) {
            return c.json({ success: false, error: '用户不存在' }, 404);
        }

        // 更新允许修改的字段
        if (body.displayName !== undefined) {
            if (body.displayName.trim().length < 2) {
                return c.json({ success: false, error: '昵称至少需要2个字符' }, 400);
            }
            user.displayName = body.displayName.trim();
        }

        if (body.avatar !== undefined) {
            user.avatar = body.avatar;
        }

        user.updatedAt = new Date().toISOString();
        await storage.saveUser(user);

        apiLogger.info(`✅ 用户 ${user.username} 更新了资料`);

        return c.json({
            success: true,
            user: toCurrentUser(user),
        });
    } catch (error) {
        apiLogger.error('更新用户资料失败', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : '更新失败',
        }, 500);
    }
});

// ============================================
// 游戏 API - NPC 对话生成
// ============================================

/**
 * 生成 NPC 对话
 * POST /api/game/npc/:npcId/dialog
 *
 * 使用 NPC 的完整数据（包含敏感的 personality、backstory 等）在服务端生成对话，
 * 只返回对话内容给前端，不返回敏感数据。
 */
worldApi.post('/game/npc/:npcId/dialog', async (c) => {
    try {
        const { npcId } = c.req.param();
        const body = await c.req.json<{
            sessionId: string;
            spotId: string;
            dialogType: 'entry' | 'chat';
            previousDialog?: string[];
        }>();

        apiLogger.info(`🎭 生成 NPC 对话: ${npcId}`, { dialogType: body.dialogType });

        const storage = getStorage();

        // 查找 NPC 所在的景点和世界
        const worlds = await storage.getAllWorlds();
        let targetNPC: SpotNPC | null = null;
        let targetSpot: Spot | null = null;
        let targetWorld: World | null = null;

        for (const world of worlds) {
            for (const project of world.travelProjects) {
                for (const spot of project.spots) {
                    const npc = spot.npcs.find(n => n.id === npcId);
                    if (npc) {
                        targetNPC = npc;
                        targetSpot = spot;
                        targetWorld = world;
                        break;
                    }
                }
                if (targetNPC) break;
            }
            if (targetNPC) break;
        }

        if (!targetNPC || !targetSpot || !targetWorld) {
            apiLogger.warn(`NPC 不存在: ${npcId}`);
            return c.json({ error: 'NPC not found' }, 404);
        }

        // 先尝试读取已存储的脚本
        const existingScripts = await storage.getDialogScripts({
            npcId,
            spotId: targetSpot.id,
            type: body.dialogType,
            isActive: true,
            limit: 1,
        });

        if (existingScripts.length > 0) {
            const script = existingScripts[0];
            apiLogger.info(`✅ 使用已存储对话脚本: ${script.id}`);
            return c.json({ dialogLines: script.lines });
        }

        // 未命中则调用 AI 生成并落库
        const config = {
            apiKey: process.env.OPENAI_API_KEY || '',
            baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        };

        const result = await ai_generate_npc_dialog(
            {
                npc: targetNPC,     // 完整 NPC 数据，包含 personality、backstory、speakingStyle
                spot: targetSpot,
                world: targetWorld,
                dialogType: body.dialogType,
                previousDialog: body.previousDialog,
            },
            config
        );

        if (!result.success || !result.data) {
            apiLogger.error('对话生成失败', result.error);
            return c.json({
                error: result.error || '对话生成失败',
            }, 500);
        }

        // 保存生成的脚本
        const script: DialogScript = {
            id: generateId('dlg_'),
            npcId,
            spotId: targetSpot.id,
            type: body.dialogType,
            lines: result.data,
            condition: undefined,
            order: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await storage.saveDialogScript(script);

        apiLogger.info(`✅ 对话生成并保存: ${script.id} (${result.data.length} 条)`);

        return c.json({
            dialogLines: result.data,
        });
    } catch (error) {
        apiLogger.error('生成 NPC 对话失败', error);
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

// 导出 getCurrentUserFromRequest 供其他地方使用
export { getCurrentUserFromRequest };

export default worldApi;
