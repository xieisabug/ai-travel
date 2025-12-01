import { useState, useCallback, useEffect, useRef } from 'react';
import type { World, TravelProject, TravelSession } from '~/types/world';

// 任务状态类型
interface TaskStatus {
    id: string;
    type: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    progressMessage: string;
    result?: unknown;
    error?: string;
}

interface WorldsState {
    worlds: World[];
    currentWorld: World | null;
    projects: TravelProject[];
    currentSession: TravelSession | null;
    isLoading: boolean;
    isGenerating: boolean;
    error: string | null;
    // 任务相关
    currentTask: TaskStatus | null;
    taskProgress: number;
    taskMessage: string;
}

const initialState: WorldsState = {
    worlds: [],
    currentWorld: null,
    projects: [],
    currentSession: null,
    isLoading: false,
    isGenerating: false,
    error: null,
    currentTask: null,
    taskProgress: 0,
    taskMessage: '',
};

// 轮询间隔（毫秒）
const POLL_INTERVAL = 1000;

export function useWorlds() {
    const [state, setState] = useState<WorldsState>(initialState);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // 清理轮询
    const stopPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    }, []);

    // 轮询任务状态
    const pollTaskStatus = useCallback(async (taskId: string, onComplete: (result: unknown) => void) => {
        stopPolling();

        const poll = async () => {
            try {
                const response = await fetch(`/api/tasks/${taskId}`);
                if (!response.ok) {
                    throw new Error('获取任务状态失败');
                }

                const task: TaskStatus = await response.json();

                setState(prev => ({
                    ...prev,
                    currentTask: task,
                    taskProgress: task.progress,
                    taskMessage: task.progressMessage,
                }));

                if (task.status === 'completed') {
                    stopPolling();
                    setState(prev => ({
                        ...prev,
                        isGenerating: false,
                        currentTask: null,
                    }));
                    onComplete(task.result);
                } else if (task.status === 'failed') {
                    stopPolling();
                    setState(prev => ({
                        ...prev,
                        isGenerating: false,
                        error: task.error || '任务失败',
                        currentTask: null,
                    }));
                }
            } catch (error) {
                console.error('轮询任务状态失败:', error);
            }
        };

        // 立即执行一次
        await poll();

        // 开始轮询
        pollIntervalRef.current = setInterval(poll, POLL_INTERVAL);
    }, [stopPolling]);

    // 组件卸载时清理轮询
    useEffect(() => {
        return () => stopPolling();
    }, [stopPolling]);

    // 获取所有世界
    const fetchWorlds = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const response = await fetch('/api/worlds');
            if (!response.ok) throw new Error('获取世界列表失败');
            const data = await response.json() as { worlds?: World[] };
            setState(prev => ({
                ...prev,
                worlds: data.worlds || [],
                isLoading: false,
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : '未知错误',
                isLoading: false,
            }));
        }
    }, []);

    // 生成新世界（异步任务）
    const generateWorld = useCallback(async () => {
        setState(prev => ({
            ...prev,
            isGenerating: true,
            error: null,
            taskProgress: 0,
            taskMessage: '正在创建世界生成任务...',
        }));

        try {
            const response = await fetch('/api/worlds/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})) as { error?: string };
                throw new Error(errorData.error || '生成世界失败');
            }

            const data = await response.json() as { taskId?: string; error?: string };

            if (data.taskId) {
                // 异步任务模式：开始轮询
                setState(prev => ({
                    ...prev,
                    taskMessage: '任务已创建，等待执行...',
                }));

                pollTaskStatus(data.taskId, async (result) => {
                    // 任务完成，刷新世界列表
                    await fetchWorlds();

                    if (result && typeof result === 'object' && 'id' in result) {
                        const world = result as World;
                        setState(prev => ({
                            ...prev,
                            currentWorld: world,
                            projects: world.travelProjects || [],
                        }));
                    }
                });

                return null; // 异步模式不立即返回世界
            } else {
                // 同步模式（兼容旧接口）
                const world = data as unknown as World;
                setState(prev => ({
                    ...prev,
                    worlds: [world, ...prev.worlds],
                    currentWorld: world,
                    projects: world.travelProjects || [],
                    isGenerating: false,
                }));
                return world;
            }
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : '未知错误',
                isGenerating: false,
            }));
            return null;
        }
    }, [pollTaskStatus]);

    // 选择一个世界
    const selectWorld = useCallback(async (worldId: string) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const response = await fetch(`/api/worlds/${worldId}`);
            if (!response.ok) throw new Error('获取世界详情失败');
            const world: World = await response.json();
            setState(prev => ({
                ...prev,
                currentWorld: world,
                projects: world.travelProjects || [],
                isLoading: false,
            }));
            return world;
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : '未知错误',
                isLoading: false,
            }));
            return null;
        }
    }, []);

    // 选择旅行项目并生成详情（异步任务）
    const selectProject = useCallback(async (projectId: string) => {
        setState(prev => ({
            ...prev,
            isGenerating: true,
            error: null,
            taskProgress: 0,
            taskMessage: '正在创建项目生成任务...',
        }));

        try {
            const response = await fetch(`/api/projects/${projectId}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})) as { error?: string };
                throw new Error(errorData.error || '生成项目详情失败');
            }

            const data = await response.json() as { taskId?: string } | TravelProject;

            if ('taskId' in data && data.taskId) {
                // 异步任务模式
                pollTaskStatus(data.taskId, (result) => {
                    if (result && typeof result === 'object' && 'id' in result) {
                        const project = result as TravelProject;
                        setState(prev => ({
                            ...prev,
                            projects: prev.projects.map(p => p.id === projectId ? project : p),
                        }));
                    }
                });
                return null;
            } else {
                // 同步模式或已完成的项目
                const project = data as TravelProject;
                setState(prev => ({
                    ...prev,
                    projects: prev.projects.map(p => p.id === projectId ? project : p),
                    isGenerating: false,
                }));
                return project;
            }
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : '未知错误',
                isGenerating: false,
            }));
            return null;
        }
    }, [pollTaskStatus]);

    // 创建旅行会话
    const createSession = useCallback(async (
        projectId: string,
        playerName: string,
        playerCharacteristics?: string[]
    ) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    playerName,
                    playerCharacteristics,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})) as { error?: string };
                throw new Error(errorData.error || '创建旅行会话失败');
            }
            const session: TravelSession = await response.json();
            setState(prev => ({
                ...prev,
                currentSession: session,
                isLoading: false,
            }));
            return session;
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : '未知错误',
                isLoading: false,
            }));
            return null;
        }
    }, []);

    // 获取会话状态
    const getSessionStatus = useCallback(async (sessionId: string) => {
        try {
            const response = await fetch(`/api/sessions/${sessionId}`);
            if (!response.ok) throw new Error('获取会话状态失败');
            const session: TravelSession = await response.json();
            setState(prev => ({
                ...prev,
                currentSession: session,
            }));
            return session;
        } catch (error) {
            console.error('获取会话状态失败:', error);
            return null;
        }
    }, []);

    // 清除错误
    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    // 初始化时获取世界列表
    useEffect(() => {
        fetchWorlds();
    }, [fetchWorlds]);

    return {
        ...state,
        fetchWorlds,
        generateWorld,
        selectWorld,
        selectProject,
        createSession,
        getSessionStatus,
        clearError,
    };
}
