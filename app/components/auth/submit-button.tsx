import type { ReactNode } from 'react';

interface SubmitButtonProps {
    children: ReactNode;
    loading?: boolean;
    disabled?: boolean;
    className?: string;
}

/**
 * 提交按钮组件 - 渐变样式的提交按钮
 */
export function SubmitButton({
    children,
    loading = false,
    disabled = false,
    className = '',
}: SubmitButtonProps) {
    return (
        <button
            type="submit"
            disabled={loading || disabled}
            className={`w-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-8 py-4 rounded-full text-base font-medium cursor-pointer transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none ${className}`}
        >
            {children}
        </button>
    );
}
