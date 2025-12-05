/**
 * 统一的 API 请求封装
 *
 * 自动处理：
 * - Cookie 携带（credentials: 'include'）
 * - 未登录（401）错误
 * - 权限不足（403）错误
 * - 统一的错误处理
 */

// ============================================
// 类型定义
// ============================================

/** API 响应基础结构 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    error?: string;
    data?: T;
}

/** 请求配置 */
export interface RequestOptions extends Omit<RequestInit, 'body'> {
    /** 请求体（会自动序列化为 JSON） */
    body?: unknown;
    /** 是否需要登录（默认 false） */
    requireAuth?: boolean;
    /** 未登录时的回调 */
    onUnauthorized?: () => void;
    /** 权限不足时的回调 */
    onForbidden?: (message: string) => void;
}

/** API 错误类型 */
export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public code?: string,
        public data?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
    }

    /** 是否未登录错误 */
    get isUnauthorized(): boolean {
        return this.status === 401;
    }

    /** 是否权限不足错误 */
    get isForbidden(): boolean {
        return this.status === 403;
    }

    /** 是否资源未找到错误 */
    get isNotFound(): boolean {
        return this.status === 404;
    }

    /** 是否服务器错误 */
    get isServerError(): boolean {
        return this.status >= 500;
    }
}

// ============================================
// 全局事件处理器
// ============================================

/** 全局未登录事件监听器 */
let globalUnauthorizedHandler: (() => void) | null = null;

/** 全局权限不足事件监听器 */
let globalForbiddenHandler: ((message: string) => void) | null = null;

/**
 * 设置全局未登录处理器
 * 当请求返回 401 时会调用此函数
 */
export function setGlobalUnauthorizedHandler(handler: () => void): void {
    globalUnauthorizedHandler = handler;
}

/**
 * 设置全局权限不足处理器
 * 当请求返回 403 时会调用此函数
 */
export function setGlobalForbiddenHandler(handler: (message: string) => void): void {
    globalForbiddenHandler = handler;
}

// ============================================
// 请求函数
// ============================================

/**
 * 统一的 API 请求函数
 */
export async function request<T = unknown>(
    url: string,
    options: RequestOptions = {}
): Promise<T> {
    const {
        body,
        requireAuth = false,
        onUnauthorized,
        onForbidden,
        headers: customHeaders,
        ...fetchOptions
    } = options;

    // 构建请求头
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...customHeaders,
    };

    // 构建请求配置
    const config: RequestInit = {
        ...fetchOptions,
        headers,
        credentials: 'include', // 自动携带 Cookie
    };

    // 如果有请求体，序列化为 JSON
    if (body !== undefined) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, config);

        // 解析响应
        let data: T;
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            data = await response.json();
        } else {
            data = (await response.text()) as unknown as T;
        }

        // 处理错误状态码
        if (!response.ok) {
            const errorMessage = (data as ApiResponse)?.error ||
                `请求失败: ${response.status} ${response.statusText}`;

            // 401 未登录
            if (response.status === 401) {
                const handler = onUnauthorized || globalUnauthorizedHandler;
                handler?.();
                throw new ApiError(errorMessage, 401, 'UNAUTHORIZED', data);
            }

            // 403 权限不足
            if (response.status === 403) {
                const handler = onForbidden || globalForbiddenHandler;
                handler?.(errorMessage);
                throw new ApiError(errorMessage, 403, 'FORBIDDEN', data);
            }

            // 其他错误
            throw new ApiError(errorMessage, response.status, undefined, data);
        }

        return data;
    } catch (error) {
        // 如果已经是 ApiError，直接抛出
        if (error instanceof ApiError) {
            throw error;
        }

        // 网络错误或其他错误
        throw new ApiError(
            error instanceof Error ? error.message : '网络请求失败',
            0,
            'NETWORK_ERROR'
        );
    }
}

// ============================================
// 便捷方法
// ============================================

/**
 * GET 请求
 */
export function get<T = unknown>(url: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return request<T>(url, { ...options, method: 'GET' });
}

/**
 * POST 请求
 */
export function post<T = unknown>(url: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return request<T>(url, { ...options, method: 'POST', body });
}

/**
 * PUT 请求
 */
export function put<T = unknown>(url: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return request<T>(url, { ...options, method: 'PUT', body });
}

/**
 * DELETE 请求
 */
export function del<T = unknown>(url: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return request<T>(url, { ...options, method: 'DELETE' });
}

/**
 * PATCH 请求
 */
export function patch<T = unknown>(url: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return request<T>(url, { ...options, method: 'PATCH', body });
}

// ============================================
// API 端点定义
// ============================================

/** API 基础路径 */
const API_BASE = '/api';

/**
 * 认证相关 API
 */
export const authApi = {
    /** 登录 */
    login: (data: { usernameOrEmail: string; password: string }) =>
        post(`${API_BASE}/auth/login`, data),

    /** 注册 */
    register: (data: { username: string; email: string; password: string; displayName?: string }) =>
        post(`${API_BASE}/auth/register`, data),

    /** 登出 */
    logout: () =>
        post(`${API_BASE}/auth/logout`),

    /** 获取当前用户 */
    me: () =>
        get(`${API_BASE}/auth/me`),

    /** 修改密码 */
    changePassword: (data: { oldPassword: string; newPassword: string }) =>
        post(`${API_BASE}/auth/change-password`, data),

    /** 更新用户资料 */
    updateProfile: (data: { displayName?: string; avatar?: string }) =>
        put(`${API_BASE}/auth/profile`, data),
};

/**
 * 世界相关 API
 */
export const worldApi = {
    /** 获取所有世界 */
    getAll: () =>
        get<{ worlds: unknown[] }>(`${API_BASE}/worlds`),

    /** 获取单个世界 */
    getById: (id: string) =>
        get(`${API_BASE}/worlds/${id}`),

    /** 生成新世界 */
    generate: (data?: { theme?: string; tags?: string[] }) =>
        post(`${API_BASE}/worlds/generate`, data),

    /** 删除世界 */
    delete: (id: string) =>
        del(`${API_BASE}/worlds/${id}`),
};

/**
 * 任务相关 API
 */
export const taskApi = {
    /** 获取任务状态 */
    getStatus: (id: string) =>
        get(`${API_BASE}/tasks/${id}`),

    /** 获取所有运行中的任务 */
    getRunning: () =>
        get<{ tasks: unknown[] }>(`${API_BASE}/tasks`),
};

/**
 * 项目相关 API
 */
export const projectApi = {
    /** 获取项目详情 */
    getById: (id: string) =>
        get(`${API_BASE}/projects/${id}`),

    /** 生成项目详情 */
    generate: (id: string) =>
        post(`${API_BASE}/projects/${id}/generate`),
};

/**
 * 会话相关 API
 */
export const sessionApi = {
    /** 创建会话 */
    create: (data: { projectId: string; playerName: string }) =>
        post(`${API_BASE}/sessions`, data),

    /** 获取会话详情 */
    getById: (id: string) =>
        get(`${API_BASE}/sessions/${id}`),

    /** 前往下一个景点 */
    nextSpot: (id: string, spotId: string) =>
        post(`${API_BASE}/sessions/${id}/next-spot`, { spotId }),

    /** 完成旅游 */
    complete: (id: string) =>
        post(`${API_BASE}/sessions/${id}/complete`),

    /** 添加回忆 */
    addMemory: (id: string, data: { spotId: string; title: string; description: string; image?: string }) =>
        post(`${API_BASE}/sessions/${id}/memories`, data),
};

/**
 * 管理员相关 API
 */
export const adminApi = {
    /** 获取用户列表 */
    getUsers: (params?: { page?: number; pageSize?: number; search?: string; role?: string; isActive?: boolean }) => {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.set(key, String(value));
                }
            });
        }
        const query = searchParams.toString();
        return get(`${API_BASE}/admin/users${query ? `?${query}` : ''}`);
    },

    /** 更新用户角色 */
    updateUserRole: (id: string, role: string) =>
        put(`${API_BASE}/admin/users/${id}/role`, { role }),

    /** 更新用户状态 */
    updateUserStatus: (id: string, isActive: boolean) =>
        put(`${API_BASE}/admin/users/${id}/status`, { isActive }),
};

/**
 * 货币相关 API
 */
export const currencyApi = {
    /** 获取当前余额 */
    getBalance: () =>
        get<{ success: boolean; balance: number; error?: string }>(`${API_BASE}/currency/balance`),

    /** 获取交易记录 */
    getTransactions: (limit = 20, offset = 0) =>
        get<{
            success: boolean;
            transactions: Array<{
                id: string;
                userId: string;
                amount: number;
                balanceAfter: number;
                type: string;
                description: string;
                referenceId?: string;
                referenceType?: string;
                createdAt: string;
            }>;
            total: number;
            error?: string;
        }>(`${API_BASE}/currency/transactions?limit=${limit}&offset=${offset}`),
};
