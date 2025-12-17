import { useState, useEffect } from 'react';
import { useAuthContext } from '~/hooks/use-auth';
import type { LoginResponse } from '~/types/user';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';

interface AuthModalProps {
    isOpen: boolean;
    onClose: (loginResponse?: LoginResponse) => void;
    defaultTab?: 'login' | 'register';
}

/**
 * 认证模态框 - 登录/注册
 */
export function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
    const { isLoading, error, clearError } = useAuthContext();

    const [formError, setFormError] = useState<string | null>(null);

    // 当 defaultTab 改变时更新 activeTab
    useEffect(() => {
        setActiveTab(defaultTab);
    }, [defaultTab]);

    if (!isOpen) return null;

    const switchTab = (tab: 'login' | 'register') => {
        setActiveTab(tab);
        setFormError(null);
        clearError();
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* 背景遮罩 */}
            <div
                className="absolute inset-0 bg-black/85 backdrop-blur-xl"
                onClick={handleClose}
            />

            {/* 模态框 */}
            <div className="relative bg-gradient-to-br from-[#1c1c1e] to-[#141416] rounded-3xl shadow-[0_50px_100px_rgba(0,0,0,0.5)] w-full max-w-[420px] overflow-hidden border border-white/10">
                {/* 关闭按钮 */}
                <button
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/10 border-none rounded-full cursor-pointer transition-all hover:bg-white/15 hover:rotate-90 z-10"
                    onClick={handleClose}
                >
                    <svg className="w-4 h-4 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                {/* 标签页切换 */}
                <div className="flex border-b border-white/10">
                    <button
                        className={`flex-1 py-4 text-center font-medium transition-all ${
                            activeTab === 'login'
                                ? 'text-white border-b-2 border-indigo-500 bg-white/5'
                                : 'text-white/40 hover:text-white/60'
                        }`}
                        onClick={() => switchTab('login')}
                    >
                        登录
                    </button>
                    <button
                        className={`flex-1 py-4 text-center font-medium transition-all ${
                            activeTab === 'register'
                                ? 'text-white border-b-2 border-indigo-500 bg-white/5'
                                : 'text-white/40 hover:text-white/60'
                        }`}
                        onClick={() => switchTab('register')}
                    >
                        注册
                    </button>
                </div>

                {/* 表单内容 */}
                <div className="p-8">
                    {/* 标题 */}
                    <h2 className="text-[28px] font-bold mb-2 text-white">
                        {activeTab === 'login' ? '欢迎回来' : '创建账号'}
                    </h2>
                    <p className="text-white/50 mb-6">
                        {activeTab === 'login' ? '登录以继续你的旅程' : '注册以开启你的旅程'}
                    </p>

                    {/* 错误提示 */}
                    {(error || formError) && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                            {error || formError}
                        </div>
                    )}

                    {activeTab === 'login' ? (
                        <LoginForm
                            onSuccess={onClose}
                            onError={setFormError}
                            isLoading={isLoading}
                        />
                    ) : (
                        <RegisterForm
                            onSuccess={() => onClose()}
                            onError={setFormError}
                            isLoading={isLoading}
                        />
                    )}

                    {/* 提示文字 */}
                    <p className="mt-6 text-center text-sm text-white/50">
                        {activeTab === 'login' ? (
                            <>
                                还没有账号？{' '}
                                <button
                                    className="text-indigo-400 font-medium hover:underline bg-transparent border-none cursor-pointer"
                                    onClick={() => switchTab('register')}
                                >
                                    立即注册
                                </button>
                            </>
                        ) : (
                            <>
                                已有账号？{' '}
                                <button
                                    className="text-indigo-400 font-medium hover:underline bg-transparent border-none cursor-pointer"
                                    onClick={() => switchTab('login')}
                                >
                                    立即登录
                                </button>
                            </>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
