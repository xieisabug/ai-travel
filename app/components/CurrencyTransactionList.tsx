import { useEffect } from 'react';
import { useCurrency, formatCurrency, formatCurrencyChange } from '~/hooks/useCurrency';
import type { CurrencyTransaction, CurrencyTransactionType } from '~/types/currency';
import { TRANSACTION_TYPE_NAMES } from '~/types/currency';

// ============================================
// 交易类型图标和颜色
// ============================================

const TRANSACTION_ICONS: Record<CurrencyTransactionType, string> = {
    daily_claim: '🎁',
    travel_spend: '🎫',
    travel_earn: '💎',
    purchase: '🛒',
    refund: '↩️',
    admin_grant: '⚙️',
};

const TRANSACTION_COLORS: Record<CurrencyTransactionType, { bg: string; text: string }> = {
    daily_claim: { bg: 'bg-green-500/20', text: 'text-green-400' },
    travel_spend: { bg: 'bg-red-500/20', text: 'text-red-400' },
    travel_earn: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
    purchase: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
    refund: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    admin_grant: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
};

// ============================================
// 单条交易记录组件
// ============================================

interface TransactionItemProps {
    transaction: CurrencyTransaction;
}

function TransactionItem({ transaction }: TransactionItemProps) {
    const { type, amount, description, createdAt } = transaction;
    const icon = TRANSACTION_ICONS[type] || '💰';
    const colors = TRANSACTION_COLORS[type] || { bg: 'bg-gray-500/20', text: 'text-gray-400' };
    const typeName = TRANSACTION_TYPE_NAMES[type] || type;
    const isIncome = amount > 0;

    // 格式化时间
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        // 小于 1 分钟
        if (diff < 60 * 1000) {
            return '刚刚';
        }

        // 小于 1 小时
        if (diff < 60 * 60 * 1000) {
            return `${Math.floor(diff / (60 * 1000))} 分钟前`;
        }

        // 小于 24 小时
        if (diff < 24 * 60 * 60 * 1000) {
            return `${Math.floor(diff / (60 * 60 * 1000))} 小时前`;
        }

        // 小于 7 天
        if (diff < 7 * 24 * 60 * 60 * 1000) {
            return `${Math.floor(diff / (24 * 60 * 60 * 1000))} 天前`;
        }

        // 其他显示完整日期
        return date.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="flex items-center gap-4 p-4 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl transition-colors">
            {/* 图标 */}
            <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center text-lg`}>
                {icon}
            </div>

            {/* 描述和类型 */}
            <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm truncate">
                    {description}
                </div>
                <div className={`text-xs ${colors.text}`}>
                    {typeName}
                </div>
            </div>

            {/* 金额和时间 */}
            <div className="text-right">
                <div className={`font-bold text-sm ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrencyChange(amount)}
                </div>
                <div className="text-xs text-white/40">
                    {formatDate(createdAt)}
                </div>
            </div>
        </div>
    );
}

// ============================================
// 交易记录列表组件
// ============================================

interface CurrencyTransactionListProps {
    /** 最大显示数量 (不传则显示所有) */
    maxItems?: number;
    /** 是否显示标题 */
    showTitle?: boolean;
    /** 是否显示加载更多按钮 */
    showLoadMore?: boolean;
    /** 自定义类名 */
    className?: string;
}

/**
 * 货币交易记录列表组件
 *
 * 显示用户的远方币交易记录
 */
export function CurrencyTransactionList({
    maxItems,
    showTitle = true,
    showLoadMore = true,
    className = '',
}: CurrencyTransactionListProps) {
    const {
        transactions,
        transactionsTotal,
        isLoadingTransactions,
        loadTransactions,
        loadMoreTransactions,
        error,
    } = useCurrency();

    // 初始加载
    useEffect(() => {
        loadTransactions(maxItems || 20, 0);
    }, [loadTransactions, maxItems]);

    const displayTransactions = maxItems
        ? transactions.slice(0, maxItems)
        : transactions;

    const hasMore = transactions.length < transactionsTotal;

    return (
        <div className={`${className}`}>
            {/* 标题 */}
            {showTitle && (
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold text-lg">交易记录</h3>
                    <span className="text-white/40 text-sm">
                        共 {transactionsTotal} 条
                    </span>
                </div>
            )}

            {/* 错误提示 */}
            {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm mb-4">
                    {error}
                </div>
            )}

            {/* 列表 */}
            {displayTransactions.length === 0 && !isLoadingTransactions ? (
                <div className="p-8 text-center text-white/40">
                    暂无交易记录
                </div>
            ) : (
                <div className="space-y-2">
                    {displayTransactions.map(transaction => (
                        <TransactionItem
                            key={transaction.id}
                            transaction={transaction}
                        />
                    ))}
                </div>
            )}

            {/* 加载中 */}
            {isLoadingTransactions && (
                <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-amber-400 rounded-full animate-spin" />
                </div>
            )}

            {/* 加载更多 */}
            {showLoadMore && hasMore && !isLoadingTransactions && (
                <button
                    onClick={loadMoreTransactions}
                    className="w-full mt-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                    加载更多
                </button>
            )}
        </div>
    );
}
