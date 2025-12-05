import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks/useAuth';
import { useCurrency, formatCurrency } from '~/hooks/useCurrency';
import { CurrencyTransactionList } from '~/components/CurrencyTransactionList';
import { CurrencyDisplay } from '~/components/CurrencyDisplay';
import { UserInfo } from '~/components/AuthModal';
import { authApi, ApiError } from '~/lib/api';
import { USER_ROLE_NAMES } from '~/types/user';
import { CURRENCY_NAME } from '~/types/currency';

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuthContext();
    const { balance, refreshBalance, isLoading: balanceLoading } = useCurrency();

    // 编辑状态
    const [isEditingName, setIsEditingName] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // 初始化
    useEffect(() => {
        if (isAuthenticated) {
            refreshBalance();
        }
    }, [isAuthenticated, refreshBalance]);

    useEffect(() => {
        if (user) {
            setNewDisplayName(user.displayName);
        }
    }, [user]);

    // 未登录重定向
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/');
        }
    }, [authLoading, isAuthenticated, navigate]);

    // 保存昵称
    const handleSaveName = async () => {
        if (!newDisplayName.trim() || newDisplayName.trim().length < 2) {
            setError('昵称至少需要2个字符');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const result = await authApi.updateProfile({ displayName: newDisplayName.trim() }) as {
                success: boolean;
                error?: string;
            };

            if (result.success) {
                setSuccessMessage('昵称更新成功');
                setIsEditingName(false);
                refreshUser();
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                setError(result.error || '更新失败');
            }
        } catch (err) {
            console.error('更新昵称失败:', err);
            setError(err instanceof ApiError ? err.message : '更新失败');
        } finally {
            setIsSaving(false);
        }
    };

    // 格式化日期
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.15),transparent)] pointer-events-none" />
                <div className="w-12 h-12 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans antialiased overflow-x-hidden relative">
            {/* 背景装饰 - 与首页一致 */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.15),transparent)] pointer-events-none z-0" />
            <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none z-0" />
            <div className="fixed top-1/2 left-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(118,75,162,0.1)_0%,transparent_70%)] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" />

            {/* 导航栏 - 与首页一致 */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 py-4 bg-black/60 backdrop-blur-xl backdrop-saturate-150 border-b border-white/5">
                <Link to="/" className="text-xl font-semibold tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <span className="text-2xl bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent">✦</span>
                    云旅游
                </Link>
                <div className="flex items-center gap-10">
                    <Link to="/worlds" className="text-white/70 text-sm font-medium hover:text-white transition-colors relative group">
                        探索世界
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 transition-all group-hover:w-full" />
                    </Link>
                    <span className="text-white text-sm font-medium relative">
                        个人中心
                        <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
                    </span>
                    <CurrencyDisplay />
                    <UserInfo />
                </div>
            </nav>

            {/* 主要内容区域 */}
            <div className="relative z-10 pt-24 pb-16 px-8">
                <div className="max-w-5xl mx-auto">
                    {/* 页面标题 */}
                    <div className="text-center mb-12">
                        <span className="inline-block px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-sm text-indigo-400 font-medium mb-4">
                            个人中心
                        </span>
                        <h1 className="text-4xl font-bold tracking-tight mb-4">
                            欢迎回来，
                            <span className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-400 bg-clip-text text-transparent">
                                {user.displayName}
                            </span>
                        </h1>
                        <p className="text-white/50 text-lg">管理你的账户信息和查看交易记录</p>
                    </div>

                    {/* 成功/错误提示 */}
                    {successMessage && (
                        <div className="max-w-2xl mx-auto mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm text-center">
                            {successMessage}
                        </div>
                    )}
                    {error && (
                        <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* 卡片网格布局 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* 用户信息卡片 */}
                        <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] rounded-[20px] p-8 transition-all hover:border-white/15">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-semibold">个人资料</h2>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-6">
                                {/* 头像 */}
                                <div className="flex-shrink-0 flex justify-center sm:justify-start">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-[0_0_30px_rgba(102,126,234,0.3)]">
                                        {user.displayName.charAt(0).toUpperCase()}
                                    </div>
                                </div>

                                {/* 信息列表 */}
                                <div className="flex-1 space-y-4">
                                    {/* 昵称 */}
                                    <div>
                                        <label className="block text-white/40 text-xs uppercase tracking-wider mb-1">昵称</label>
                                        {isEditingName ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newDisplayName}
                                                    onChange={(e) => setNewDisplayName(e.target.value)}
                                                    className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                                    placeholder="输入新昵称"
                                                    maxLength={20}
                                                />
                                                <button
                                                    onClick={handleSaveName}
                                                    disabled={isSaving}
                                                    className="px-3 py-2 bg-gradient-to-br from-indigo-500 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white text-sm rounded-lg transition-all"
                                                >
                                                    {isSaving ? '...' : '保存'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsEditingName(false);
                                                        setNewDisplayName(user.displayName);
                                                        setError(null);
                                                    }}
                                                    className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white text-sm rounded-lg transition-all"
                                                >
                                                    取消
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-medium">{user.displayName}</span>
                                                <button
                                                    onClick={() => setIsEditingName(true)}
                                                    className="text-white/30 hover:text-indigo-400 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* 用户名 */}
                                    <div>
                                        <label className="block text-white/40 text-xs uppercase tracking-wider mb-1">用户名</label>
                                        <span className="text-white/70">@{user.username}</span>
                                    </div>

                                    {/* 邮箱 */}
                                    <div>
                                        <label className="block text-white/40 text-xs uppercase tracking-wider mb-1">邮箱</label>
                                        <span className="text-white/70">{user.email}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 账户状态卡片 */}
                        <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] rounded-[20px] p-8 transition-all hover:border-white/15">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-semibold">账户状态</h2>
                            </div>

                            <div className="space-y-4">
                                {/* 会员等级 */}
                                <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl">
                                    <div>
                                        <div className="text-white/40 text-xs uppercase tracking-wider mb-1">会员等级</div>
                                        <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-sm font-medium">
                                            {USER_ROLE_NAMES[user.role]}
                                        </span>
                                    </div>
                                    <div className="w-12 h-12 flex items-center justify-center bg-indigo-500/10 rounded-full text-2xl">
                                        {user.role === 'admin' ? '👑' : user.role === 'pro' ? '⭐' : '🌟'}
                                    </div>
                                </div>

                                {/* 注册时间 */}
                                <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl">
                                    <div>
                                        <div className="text-white/40 text-xs uppercase tracking-wider mb-1">注册时间</div>
                                        <span className="text-white/70">{formatDate(user.createdAt)}</span>
                                    </div>
                                    <div className="w-12 h-12 flex items-center justify-center bg-white/[0.05] rounded-full text-2xl">
                                        📅
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 货币信息卡片 - 全宽 */}
                    <div className="bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 border border-amber-500/20 rounded-[20px] p-8 mb-8 relative overflow-hidden">
                        {/* 装饰光效 */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="relative">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl">
                                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-semibold">我的{CURRENCY_NAME}</h2>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                <div className="flex items-center gap-4">
                                    {/* 金币图标 */}
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)]">
                                        <span className="text-3xl">💰</span>
                                    </div>

                                    {/* 余额 */}
                                    <div>
                                        <div className="text-white/50 text-sm mb-1">当前余额</div>
                                        <div className="text-amber-300 font-bold text-4xl">
                                            {balanceLoading ? '...' : formatCurrency(balance)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 md:text-right">
                                    <p className="text-white/50 text-sm">
                                        每日登录可获得 <span className="text-amber-400 font-medium">10,000</span> {CURRENCY_NAME}
                                    </p>
                                    <p className="text-white/40 text-xs mt-1">
                                        可用于购买旅游和旅途中的物品
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 交易记录卡片 - 全宽 */}
                    <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] rounded-[20px] p-8 transition-all hover:border-white/15">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold">交易记录</h2>
                        </div>
                        <CurrencyTransactionList showTitle={false} />
                    </div>
                </div>
            </div>
        </div>
    );
}
