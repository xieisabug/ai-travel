/**
 * AI 虚拟旅游 - 用户系统类型定义
 */

// ============================================
// 用户等级/角色
// ============================================

/**
 * 用户等级
 */
export type UserRole = 'free' | 'pro' | 'pro_plus' | 'admin';

/**
 * 用户等级显示名称
 */
export const USER_ROLE_NAMES: Record<UserRole, string> = {
    free: '免费用户',
    pro: 'Pro 会员',
    pro_plus: 'Pro+ 会员',
    admin: '管理员',
};

/**
 * 用户等级权限配置
 */
export interface RolePermissions {
    /** 是否可以生成世界 */
    canGenerateWorld: boolean;
    /** 每日可生成世界数量 (-1 为无限) */
    dailyWorldGenerationLimit: number;
    /** 是否可以删除世界 */
    canDeleteWorld: boolean;
    /** 是否可以查看所有用户 */
    canViewAllUsers: boolean;
    /** 是否可以管理用户 */
    canManageUsers: boolean;
    /** 是否可以访问管理后台 */
    canAccessAdmin: boolean;
    /** 同时进行的旅游会话数量 */
    maxConcurrentSessions: number;
}

/**
 * 各等级权限配置
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
    free: {
        canGenerateWorld: false,
        dailyWorldGenerationLimit: 0,
        canDeleteWorld: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canAccessAdmin: false,
        maxConcurrentSessions: 1,
    },
    pro: {
        canGenerateWorld: true,
        dailyWorldGenerationLimit: 3,
        canDeleteWorld: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canAccessAdmin: false,
        maxConcurrentSessions: 3,
    },
    pro_plus: {
        canGenerateWorld: true,
        dailyWorldGenerationLimit: 10,
        canDeleteWorld: true,
        canViewAllUsers: false,
        canManageUsers: false,
        canAccessAdmin: false,
        maxConcurrentSessions: 5,
    },
    admin: {
        canGenerateWorld: true,
        dailyWorldGenerationLimit: -1, // 无限
        canDeleteWorld: true,
        canViewAllUsers: true,
        canManageUsers: true,
        canAccessAdmin: true,
        maxConcurrentSessions: -1, // 无限
    },
};

// ============================================
// 用户实体
// ============================================

/**
 * 用户
 */
export interface User {
    /** 用户唯一标识 */
    id: string;
    /** 用户名 */
    username: string;
    /** 显示名称 */
    displayName: string;
    /** 邮箱 */
    email: string;
    /** 密码哈希 (不会返回给前端) */
    passwordHash?: string;
    /** 用户等级 */
    role: UserRole;
    /** 头像 URL */
    avatar?: string;

    // === 状态 ===
    /** 是否激活 */
    isActive: boolean;
    /** 最后登录时间 */
    lastLoginAt?: string;

    // === 统计 ===
    /** 今日已生成世界数量 */
    todayWorldGenerationCount: number;
    /** 统计重置日期 (YYYY-MM-DD) */
    statsResetDate: string;

    // === 元数据 ===
    /** 创建时间 */
    createdAt: string;
    /** 更新时间 */
    updatedAt: string;
}

/**
 * 用户公开信息 (不包含敏感字段)
 */
export type PublicUser = Omit<User, 'passwordHash'>;

/**
 * 当前登录用户信息
 */
export interface CurrentUser extends PublicUser {
    /** 当前用户的权限 */
    permissions: RolePermissions;
}

// ============================================
// 认证相关
// ============================================

/**
 * 登录请求
 */
export interface LoginRequest {
    /** 用户名或邮箱 */
    usernameOrEmail: string;
    /** 密码 */
    password: string;
}

/**
 * 注册请求
 */
export interface RegisterRequest {
    /** 用户名 */
    username: string;
    /** 邮箱 */
    email: string;
    /** 密码 */
    password: string;
    /** 显示名称 (可选，默认使用用户名) */
    displayName?: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
    /** 是否成功 */
    success: boolean;
    /** 错误信息 */
    error?: string;
    /** 用户信息 */
    user?: CurrentUser;
    /** 会话 Token */
    token?: string;
}

/**
 * 注册响应
 */
export interface RegisterResponse {
    /** 是否成功 */
    success: boolean;
    /** 错误信息 */
    error?: string;
    /** 用户信息 */
    user?: CurrentUser;
    /** 会话 Token */
    token?: string;
}

// ============================================
// 会话管理
// ============================================

/**
 * 用户会话
 */
export interface UserSession {
    /** 会话 ID */
    id: string;
    /** 用户 ID */
    userId: string;
    /** Token */
    token: string;
    /** 过期时间 */
    expiresAt: string;
    /** 创建时间 */
    createdAt: string;
    /** 用户代理 */
    userAgent?: string;
    /** IP 地址 */
    ipAddress?: string;
}

// ============================================
// 用户管理 (管理员)
// ============================================

/**
 * 更新用户请求
 */
export interface UpdateUserRequest {
    /** 显示名称 */
    displayName?: string;
    /** 邮箱 */
    email?: string;
    /** 用户等级 (仅管理员可修改) */
    role?: UserRole;
    /** 是否激活 */
    isActive?: boolean;
    /** 头像 URL */
    avatar?: string;
}

/**
 * 修改密码请求
 */
export interface ChangePasswordRequest {
    /** 旧密码 */
    oldPassword: string;
    /** 新密码 */
    newPassword: string;
}

/**
 * 用户列表查询参数
 */
export interface UserListParams {
    /** 页码 */
    page?: number;
    /** 每页数量 */
    pageSize?: number;
    /** 搜索关键词 */
    search?: string;
    /** 角色筛选 */
    role?: UserRole;
    /** 是否激活 */
    isActive?: boolean;
}

/**
 * 用户列表响应
 */
export interface UserListResponse {
    /** 用户列表 */
    users: PublicUser[];
    /** 总数 */
    total: number;
    /** 页码 */
    page: number;
    /** 每页数量 */
    pageSize: number;
}
