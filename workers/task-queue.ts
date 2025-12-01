/**
 * 异步任务队列系统
 * 
 * 用于处理耗时任务（如世界生成），立即返回任务 ID，后台执行
 */

import { taskLogger } from './logger';

// ============================================
// 类型定义
// ============================================

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export type TaskType =
    | 'generate_world'
    | 'generate_project_details'
    | 'generate_spots'
    | 'generate_images';

export interface Task<T = unknown> {
    id: string;
    type: TaskType;
    status: TaskStatus;
    progress: number;
    progressMessage: string;
    result?: T;
    error?: string;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
}

export interface TaskProgress {
    current: number;
    total: number;
    message: string;
}

type TaskExecutor<T> = (
    updateProgress: (progress: TaskProgress) => void
) => Promise<T>;

// ============================================
// 任务队列管理器
// ============================================

class TaskQueue {
    private tasks: Map<string, Task> = new Map();
    private queue: string[] = [];
    private isProcessing: boolean = false;
    private executors: Map<string, TaskExecutor<unknown>> = new Map();

    /**
     * 生成任务 ID
     */
    private generateId(): string {
        return `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    /**
     * 创建新任务
     */
    createTask<T>(type: TaskType, executor: TaskExecutor<T>): Task<T> {
        const id = this.generateId();
        const task: Task<T> = {
            id,
            type,
            status: 'pending',
            progress: 0,
            progressMessage: '等待执行...',
            createdAt: new Date().toISOString(),
        };

        this.tasks.set(id, task as Task);
        this.executors.set(id, executor as TaskExecutor<unknown>);
        this.queue.push(id);

        taskLogger.info(`📋 创建任务: ${type}`, { taskId: id });

        // 开始处理队列
        this.processQueue();

        return task;
    }

    /**
     * 获取任务状态
     */
    getTask<T = unknown>(id: string): Task<T> | undefined {
        return this.tasks.get(id) as Task<T> | undefined;
    }

    /**
     * 获取所有任务
     */
    getAllTasks(): Task[] {
        return Array.from(this.tasks.values());
    }

    /**
     * 获取正在进行的任务
     */
    getRunningTasks(): Task[] {
        return Array.from(this.tasks.values()).filter(t =>
            t.status === 'pending' || t.status === 'running'
        );
    }

    /**
     * 处理任务队列
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const taskId = this.queue.shift()!;
            const task = this.tasks.get(taskId);
            const executor = this.executors.get(taskId);

            if (!task || !executor) {
                continue;
            }

            // 更新任务状态为运行中
            task.status = 'running';
            task.startedAt = new Date().toISOString();
            task.progressMessage = '正在执行...';

            taskLogger.separator(`任务开始: ${task.type}`);
            taskLogger.startTimer(task.type);

            try {
                // 执行任务
                const result = await executor((progress) => {
                    task.progress = Math.round((progress.current / progress.total) * 100);
                    task.progressMessage = progress.message;
                    taskLogger.progress(progress.current, progress.total, progress.message);
                });

                // 任务完成
                task.status = 'completed';
                task.progress = 100;
                task.progressMessage = '已完成';
                task.result = result;
                task.completedAt = new Date().toISOString();

                taskLogger.endTimer(task.type, true);

            } catch (error) {
                // 任务失败
                task.status = 'failed';
                task.error = error instanceof Error ? error.message : '未知错误';
                task.completedAt = new Date().toISOString();

                taskLogger.endTimer(task.type, false);
                taskLogger.error(`任务失败: ${task.error}`);
            }

            // 清理 executor
            this.executors.delete(taskId);
        }

        this.isProcessing = false;
    }

    /**
     * 清理已完成的旧任务（保留最近 100 个）
     */
    cleanup(): void {
        const tasks = Array.from(this.tasks.entries())
            .filter(([_, t]) => t.status === 'completed' || t.status === 'failed')
            .sort((a, b) => new Date(b[1].createdAt).getTime() - new Date(a[1].createdAt).getTime());

        if (tasks.length > 100) {
            const toRemove = tasks.slice(100);
            for (const [id] of toRemove) {
                this.tasks.delete(id);
            }
            taskLogger.info(`清理了 ${toRemove.length} 个旧任务`);
        }
    }
}

// ============================================
// 单例导出
// ============================================

export const taskQueue = new TaskQueue();

export default taskQueue;
