import { useState, useCallback, useEffect } from 'react';
import { currencyApi, ApiError } from '~/lib/api';
import type { CurrencyTransaction } from '~/types/currency';

// ============================================
// 货币状态类型
// ============================================

interface CurrencyState {
    balance: number;
    transactions: CurrencyTransaction[];
    transactionsTotal: number;
    isLoading: boolean;
    isLoadingTransactions: boolean;
    error: string | null;
}

interface UseCurrencyReturn extends CurrencyState {
    refreshBalance: () => Promise<void>;
    loadTransactions: (limit?: number, offset?: number) => Promise<void>;
    loadMoreTransactions: () => Promise<void>;
}

const initialState: CurrencyState = {
    balance: 0,
    transactions: [],
    transactionsTotal: 0,
    isLoading: false,
    isLoadingTransactions: false,
    error: null,
};

// ============================================
// 货币 Hook
// ============================================

/**
 * 货币管理 Hook
 *
 * 用于获取和管理用户的远方币余额和交易记录
 */
export function useCurrency(): UseCurrencyReturn {
    const [state, setState] = useState<CurrencyState>(initialState);

    // 刷新余额
    const refreshBalance = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const result = await currencyApi.getBalance();

            if (result.success) {
                setState(prev => ({
                    ...prev,
                    balance: result.balance,
                    isLoading: false,
                    error: null,
                }));
            } else {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: result.error || '获取余额失败',
                }));
            }
        } catch (error) {
            console.error('获取余额失败:', error);
            const errorMessage = error instanceof ApiError ? error.message : '获取余额失败';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
        }
    }, []);

    // 加载交易记录
    const loadTransactions = useCallback(async (limit = 20, offset = 0) => {
        setState(prev => ({ ...prev, isLoadingTransactions: true, error: null }));

        try {
            const result = await currencyApi.getTransactions(limit, offset);

            if (result.success) {
                setState(prev => ({
                    ...prev,
                    transactions: offset === 0
                        ? result.transactions as CurrencyTransaction[]
                        : [...prev.transactions, ...(result.transactions as CurrencyTransaction[])],
                    transactionsTotal: result.total,
                    isLoadingTransactions: false,
                    error: null,
                }));
            } else {
                setState(prev => ({
                    ...prev,
                    isLoadingTransactions: false,
                    error: result.error || '获取交易记录失败',
                }));
            }
        } catch (error) {
            console.error('获取交易记录失败:', error);
            const errorMessage = error instanceof ApiError ? error.message : '获取交易记录失败';
            setState(prev => ({
                ...prev,
                isLoadingTransactions: false,
                error: errorMessage,
            }));
        }
    }, []);

    // 加载更多交易记录
    const loadMoreTransactions = useCallback(async () => {
        const currentCount = state.transactions.length;
        if (currentCount >= state.transactionsTotal) {
            return; // 已经加载完所有记录
        }
        await loadTransactions(20, currentCount);
    }, [state.transactions.length, state.transactionsTotal, loadTransactions]);

    return {
        ...state,
        refreshBalance,
        loadTransactions,
        loadMoreTransactions,
    };
}

// ============================================
// 格式化工具函数
// ============================================

/**
 * 格式化货币数字
 * @param amount 金额
 * @returns 格式化后的字符串，如 "10,000"
 */
export function formatCurrency(amount: number): string {
    return amount.toLocaleString('zh-CN');
}

/**
 * 格式化带符号的货币变化
 * @param amount 金额
 * @returns 带 +/- 符号的格式化字符串
 */
export function formatCurrencyChange(amount: number): string {
    const formatted = formatCurrency(Math.abs(amount));
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
}
