import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCurrency, formatCurrency } from '~/hooks/use-currency';
import { useAuthContext } from '~/hooks/use-auth';
import { CURRENCY_NAME } from '~/types/currency';

interface CurrencyDisplayProps {
    /** 是否显示货币名称 */
    showName?: boolean;
    /** 点击后的跳转路径 (默认 /profile) */
    linkTo?: string;
    /** 自定义类名 */
    className?: string;
}

/**
 * 货币余额显示组件
 *
 * 在导航栏中显示用户的远方币余额
 */
export function CurrencyDisplay({
    showName = true,
    linkTo = '/profile',
    className = '',
}: CurrencyDisplayProps) {
    const { isAuthenticated, user } = useAuthContext();
    const { balance, refreshBalance, isLoading } = useCurrency();

    // 登录后刷新余额
    useEffect(() => {
        if (isAuthenticated) {
            refreshBalance();
        }
    }, [isAuthenticated, refreshBalance]);

    // 未登录不显示
    if (!isAuthenticated || !user) {
        return null;
    }

    const content = (
        <div
            className={`
                flex items-center gap-2 px-3 py-1.5
                bg-gradient-to-r from-amber-500/20 to-yellow-500/20
                border border-amber-500/30 rounded-full
                hover:from-amber-500/30 hover:to-yellow-500/30
                transition-all cursor-pointer
                ${className}
            `}
        >
            {/* 金币图标 */}
            <span className="text-amber-400 text-lg">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
                </svg>
            </span>

            {/* 余额数字 */}
            <span className="text-amber-300 font-bold text-sm">
                {isLoading ? '...' : formatCurrency(balance)}
            </span>

            {/* 货币名称 */}
            {showName && (
                <span className="text-amber-400/70 text-xs hidden sm:inline">
                    {CURRENCY_NAME}
                </span>
            )}
        </div>
    );

    // 如果有链接，包裹 Link
    if (linkTo) {
        return (
            <Link to={linkTo} className="no-underline">
                {content}
            </Link>
        );
    }

    return content;
}

/**
 * 紧凑版货币显示组件
 *
 * 用于空间有限的地方
 */
export function CurrencyDisplayCompact({ className = '' }: { className?: string }) {
    return (
        <CurrencyDisplay
            showName={false}
            className={`px-2 py-1 ${className}`}
        />
    );
}
