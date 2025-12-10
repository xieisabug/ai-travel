import { useState, useEffect } from 'react';
import { formatCurrency } from '~/hooks/use-currency';
import { CURRENCY_NAME } from '~/types/currency';

interface DailyRewardToastProps {
    /** 奖励金额 */
    amount: number;
    /** 显示时长（毫秒），默认 5000ms */
    duration?: number;
    /** 关闭回调 */
    onClose?: () => void;
}

/**
 * 每日登录奖励通知组件
 *
 * 登录后自动弹出，显示获得的每日奖励
 */
export function DailyRewardToast({
    amount,
    duration = 5000,
    onClose,
}: DailyRewardToastProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    // 自动关闭
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsAnimatingOut(true);
            setTimeout(() => {
                setIsVisible(false);
                onClose?.();
            }, 300); // 动画时长
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    // 手动关闭
    const handleClose = () => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose?.();
        }, 300);
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div
            className={`
                fixed top-20 left-1/2 -translate-x-1/2 z-50
                transform transition-all duration-300 ease-out
                ${isAnimatingOut
                    ? 'opacity-0 -translate-y-4'
                    : 'opacity-100 translate-y-0'
                }
            `}
        >
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/90 to-yellow-500/90 backdrop-blur-md rounded-2xl shadow-2xl border border-amber-400/50">
                {/* 光效 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />

                <div className="relative px-6 py-4 flex items-center gap-4">
                    {/* 图标 */}
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl animate-bounce">
                        🎁
                    </div>

                    {/* 内容 */}
                    <div>
                        <div className="text-white font-bold text-lg">
                            每日登录奖励
                        </div>
                        <div className="text-white/90 text-sm">
                            获得
                            <span className="font-bold text-white mx-1">
                                +{formatCurrency(amount)}
                            </span>
                            {CURRENCY_NAME}
                        </div>
                    </div>

                    {/* 关闭按钮 */}
                    <button
                        onClick={handleClose}
                        className="ml-2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-4 h-4"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 进度条 */}
                <div className="h-1 bg-white/20">
                    <div
                        className="h-full bg-white/60 origin-left"
                        style={{
                            animation: `shrink ${duration}ms linear forwards`,
                        }}
                    />
                </div>
            </div>

            {/* 添加 shrink 动画的样式 */}
            <style>{`
                @keyframes shrink {
                    from { transform: scaleX(1); }
                    to { transform: scaleX(0); }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%) skewX(-12deg); }
                    100% { transform: translateX(200%) skewX(-12deg); }
                }
                .animate-shimmer {
                    animation: shimmer 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}

// ============================================
// 用于管理 Toast 显示的 Hook
// ============================================

interface UseDailyRewardToastReturn {
    showToast: (amount: number) => void;
    ToastComponent: React.FC;
}

/**
 * 管理每日奖励通知的 Hook
 */
export function useDailyRewardToast(): UseDailyRewardToastReturn {
    const [toastState, setToastState] = useState<{
        show: boolean;
        amount: number;
    }>({
        show: false,
        amount: 0,
    });

    const showToast = (amount: number) => {
        setToastState({ show: true, amount });
    };

    const hideToast = () => {
        setToastState(prev => ({ ...prev, show: false }));
    };

    const ToastComponent: React.FC = () => {
        if (!toastState.show) return null;
        return (
            <DailyRewardToast
                amount={toastState.amount}
                onClose={hideToast}
            />
        );
    };

    return { showToast, ToastComponent };
}
