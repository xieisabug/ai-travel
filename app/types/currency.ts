/**
 * AI 虚拟旅游 - 货币系统类型定义
 */

// ============================================
// 货币常量
// ============================================

/** 每日登录奖励金额 */
export const DAILY_CLAIM_AMOUNT = 10000;

/** 货币名称 */
export const CURRENCY_NAME = '远方币';

// ============================================
// 交易类型
// ============================================

/**
 * 货币交易类型
 */
export type CurrencyTransactionType =
    | 'daily_claim'    // 每日登录奖励
    | 'travel_spend'   // 旅途消费
    | 'travel_earn'    // 旅途收益
    | 'purchase'       // 购买物品
    | 'refund'         // 退款
    | 'admin_grant';   // 管理员调整

/**
 * 交易类型显示名称
 */
export const TRANSACTION_TYPE_NAMES: Record<CurrencyTransactionType, string> = {
    daily_claim: '每日登录奖励',
    travel_spend: '旅途消费',
    travel_earn: '旅途收益',
    purchase: '购买物品',
    refund: '退款',
    admin_grant: '系统调整',
};

// ============================================
// 交易记录
// ============================================

/**
 * 货币交易记录
 */
export interface CurrencyTransaction {
    /** 交易唯一标识 */
    id: string;
    /** 用户 ID */
    userId: string;
    /** 交易金额 (正数收入，负数支出) */
    amount: number;
    /** 交易后余额快照 */
    balanceAfter: number;
    /** 交易类型 */
    type: CurrencyTransactionType;
    /** 交易描述 */
    description: string;
    /** 关联 ID (如世界ID、景点ID等) */
    referenceId?: string;
    /** 关联类型 */
    referenceType?: 'world' | 'session' | 'item';
    /** 创建时间 */
    createdAt: string;
}

// ============================================
// API 响应类型
// ============================================

/**
 * 余额查询响应
 */
export interface CurrencyBalanceResponse {
    success: boolean;
    balance: number;
    error?: string;
}

/**
 * 交易记录查询响应
 */
export interface CurrencyTransactionsResponse {
    success: boolean;
    transactions: CurrencyTransaction[];
    total?: number;
    error?: string;
}

/**
 * 每日奖励领取结果
 */
export interface DailyClaimResult {
    /** 是否领取成功 */
    claimed: boolean;
    /** 领取金额 */
    amount: number;
    /** 领取后新余额 */
    newBalance: number;
}
