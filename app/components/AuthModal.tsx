import { useState, useEffect } from 'react';
import { useAuthContext } from '~/hooks/useAuth';
import { USER_ROLE_NAMES } from '~/types/user';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultTab?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
    const { login, register, isLoading, error, clearError } = useAuthContext();

    // 当 defaultTab 改变时更新 activeTab
    useEffect(() => {
        setActiveTab(defaultTab);
    }, [defaultTab]);

    // 登录表单状态
    const [loginForm, setLoginForm] = useState({
        usernameOrEmail: '',
        password: '',
    });

    // 注册表单状态
    const [registerForm, setRegisterForm] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        displayName: '',
    });

    const [formError, setFormError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        clearError();

        if (!loginForm.usernameOrEmail || !loginForm.password) {
            setFormError('请填写所有必填项');
            return;
        }

        const success = await login(loginForm);
        if (success) {
            onClose();
            // 重置表单
            setLoginForm({ usernameOrEmail: '', password: '' });
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        clearError();

        if (!registerForm.username || !registerForm.email || !registerForm.password) {
            setFormError('请填写所有必填项');
            return;
        }

        if (registerForm.password !== registerForm.confirmPassword) {
            setFormError('两次输入的密码不一致');
            return;
        }

        if (registerForm.password.length < 6) {
            setFormError('密码至少需要6个字符');
            return;
        }

        const success = await register({
            username: registerForm.username,
            email: registerForm.email,
            password: registerForm.password,
            displayName: registerForm.displayName || undefined,
        });

        if (success) {
            onClose();
            // 重置表单
            setRegisterForm({
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                displayName: '',
            });
        }
    };

    const switchTab = (tab: 'login' | 'register') => {
        setActiveTab(tab);
        setFormError(null);
        clearError();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* 背景遮罩 */}
            <div
                className="absolute inset-0 bg-black/85 backdrop-blur-xl"
                onClick={onClose}
            />

            {/* 模态框 */}
            <div className="relative bg-gradient-to-br from-[#1c1c1e] to-[#141416] rounded-3xl shadow-[0_50px_100px_rgba(0,0,0,0.5)] w-full max-w-[420px] overflow-hidden border border-white/10">
                {/* 关闭按钮 */}
                <button
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/10 border-none rounded-full cursor-pointer transition-all hover:bg-white/15 hover:rotate-90 z-10"
                    onClick={onClose}
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
                        <form onSubmit={handleLogin} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-white/80">
                                    用户名或邮箱
                                </label>
                                <input
                                    type="text"
                                    value={loginForm.usernameOrEmail}
                                    onChange={(e) => setLoginForm(prev => ({ ...prev, usernameOrEmail: e.target.value }))}
                                    className="bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3.5 text-base text-white transition-all placeholder:text-white/30 focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/10 focus:ring-4 focus:ring-indigo-500/10"
                                    placeholder="输入用户名或邮箱"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-white/80">
                                    密码
                                </label>
                                <input
                                    type="password"
                                    value={loginForm.password}
                                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                                    className="bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3.5 text-base text-white transition-all placeholder:text-white/30 focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/10 focus:ring-4 focus:ring-indigo-500/10"
                                    placeholder="输入密码"
                                    disabled={isLoading}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-8 py-4 rounded-full text-base font-medium cursor-pointer transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                            >
                                {isLoading ? '登录中...' : '登录'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-white/80">
                                    用户名 <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={registerForm.username}
                                    onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                                    className="bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-base text-white transition-all placeholder:text-white/30 focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/10 focus:ring-4 focus:ring-indigo-500/10"
                                    placeholder="3-20个字符，字母、数字、下划线"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-white/80">
                                    邮箱 <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={registerForm.email}
                                    onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-base text-white transition-all placeholder:text-white/30 focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/10 focus:ring-4 focus:ring-indigo-500/10"
                                    placeholder="your@email.com"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-white/80">
                                    显示名称
                                </label>
                                <input
                                    type="text"
                                    value={registerForm.displayName}
                                    onChange={(e) => setRegisterForm(prev => ({ ...prev, displayName: e.target.value }))}
                                    className="bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-base text-white transition-all placeholder:text-white/30 focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/10 focus:ring-4 focus:ring-indigo-500/10"
                                    placeholder="可选，默认使用用户名"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-white/80">
                                    密码 <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={registerForm.password}
                                    onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                                    className="bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-base text-white transition-all placeholder:text-white/30 focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/10 focus:ring-4 focus:ring-indigo-500/10"
                                    placeholder="至少6个字符"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-white/80">
                                    确认密码 <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={registerForm.confirmPassword}
                                    onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    className="bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-base text-white transition-all placeholder:text-white/30 focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/10 focus:ring-4 focus:ring-indigo-500/10"
                                    placeholder="再次输入密码"
                                    disabled={isLoading}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-8 py-4 rounded-full text-base font-medium cursor-pointer transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none mt-2"
                            >
                                {isLoading ? '注册中...' : '注册'}
                            </button>
                        </form>
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

// 用户信息显示组件
interface UserInfoProps {
    onLogout?: () => void;
}

export function UserInfo({ onLogout }: UserInfoProps) {
    const { user, logout, isAuthenticated } = useAuthContext();

    if (!isAuthenticated || !user) {
        return null;
    }

    const handleLogout = async () => {
        await logout();
        onLogout?.();
    };

    return (
        <div className="flex items-center gap-3">
            {/* 头像 */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {user.displayName.charAt(0).toUpperCase()}
            </div>

            {/* 用户信息 */}
            <div className="flex flex-col">
                <span className="text-white font-medium text-sm">{user.displayName}</span>
                <span className="text-xs text-white/40">
                    {USER_ROLE_NAMES[user.role]}
                </span>
            </div>

            {/* 登出按钮 */}
            <button
                onClick={handleLogout}
                className="ml-2 px-3 py-1.5 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
                退出
            </button>
        </div>
    );
}
