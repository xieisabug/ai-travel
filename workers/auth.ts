/**
 * 认证工具函数
 */

import crypto from 'crypto';
import type { User, CurrentUser, UserSession } from '../app/types/user';
import { ROLE_PERMISSIONS } from '../app/types/user';

// ============================================
// 密码处理
// ============================================

/**
 * 生成密码哈希
 * 使用 PBKDF2 算法
 */
export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

/**
 * 验证密码
 */
export function verifyPassword(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
}

// ============================================
// Token 生成
// ============================================

/**
 * 生成安全的随机 Token
 */
export function generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * 生成用户 ID
 */
export function generateUserId(): string {
    return `user_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * 生成会话 ID
 */
export function generateSessionId(): string {
    return `sess_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

// ============================================
// 用户转换
// ============================================

/**
 * 将用户转换为当前用户（带权限信息）
 */
export function toCurrentUser(user: User): CurrentUser {
    const { passwordHash: _, ...publicUser } = user;
    return {
        ...publicUser,
        permissions: ROLE_PERMISSIONS[user.role],
    };
}

// ============================================
// 会话管理
// ============================================

/** 会话有效期（7天） */
const SESSION_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * 创建用户会话
 */
export function createUserSession(userId: string, userAgent?: string, ipAddress?: string): UserSession {
    const now = new Date();
    return {
        id: generateSessionId(),
        userId,
        token: generateToken(),
        expiresAt: new Date(now.getTime() + SESSION_EXPIRES_MS).toISOString(),
        userAgent,
        ipAddress,
        createdAt: now.toISOString(),
    };
}

/**
 * 检查会话是否过期
 */
export function isSessionExpired(session: UserSession): boolean {
    return new Date(session.expiresAt) < new Date();
}

// ============================================
// 验证工具
// ============================================

/**
 * 验证用户名格式
 * - 3-20个字符
 * - 只允许字母、数字、下划线
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
    if (!username || username.length < 3) {
        return { valid: false, error: '用户名至少需要3个字符' };
    }
    if (username.length > 20) {
        return { valid: false, error: '用户名最多20个字符' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { valid: false, error: '用户名只能包含字母、数字和下划线' };
    }
    return { valid: true };
}

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email) {
        return { valid: false, error: '邮箱不能为空' };
    }
    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, error: '邮箱格式不正确' };
    }
    return { valid: true };
}

/**
 * 验证密码强度
 * - 至少6个字符
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password || password.length < 6) {
        return { valid: false, error: '密码至少需要6个字符' };
    }
    return { valid: true };
}

// ============================================
// 统计重置
// ============================================

/**
 * 获取今天的日期字符串 (YYYY-MM-DD)
 */
export function getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * 检查是否需要重置统计
 */
export function shouldResetStats(user: User): boolean {
    return user.statsResetDate !== getTodayDateString();
}
