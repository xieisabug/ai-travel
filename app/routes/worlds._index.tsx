import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthModal, UserInfo } from "~/components/auth";
import { CurrencyDisplay } from "~/components/currency-display";
import { DailyRewardToast } from "~/components/daily-reward-toast";
import { PageContainer, BackgroundDecorations } from "~/components/layout";
import { LoadingSpinner } from "~/components/world-game";
import { useWorlds } from "~/hooks/use-worlds";
import { useAuthContext } from "~/hooks/use-auth";
import type { LoginResponse } from "~/types/user";

export default function WorldsIndexPage() {
    const navigate = useNavigate();
    const { worlds, isLoading, error, clearError } = useWorlds();
    const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");
    const [dailyReward, setDailyReward] = useState<{ show: boolean; amount: number }>({
        show: false,
        amount: 0,
    });

    const openAuthModal = (tab: "login" | "register" = "login") => {
        setAuthModalTab(tab);
        setShowAuthModal(true);
    };

    const handleAuthModalClose = (loginResponse?: LoginResponse) => {
        setShowAuthModal(false);
        if (loginResponse?.dailyRewardClaimed && loginResponse?.dailyRewardAmount) {
            setDailyReward({ show: true, amount: loginResponse.dailyRewardAmount });
        }
    };

    const handleSelectWorld = (worldId: string) => {
        navigate(`/worlds/${worldId}`);
    };

    // 加载状态
    if (isLoading && worlds.length === 0) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <BackgroundDecorations />
                <div className="text-center relative z-10">
                    <LoadingSpinner />
                    <p className="text-white/70">正在探索异世界...</p>
                </div>
            </div>
        );
    }

    return (
        <PageContainer>
            <AuthModal
                isOpen={showAuthModal}
                onClose={handleAuthModalClose}
                defaultTab={authModalTab}
            />

            <div className="relative z-10 max-w-6xl mx-auto p-8">
                {/* 顶部导航 */}
                <TopNavigation
                    isAuthenticated={isAuthenticated}
                    authLoading={authLoading}
                    user={user}
                    onBack={() => navigate("/")}
                    onLogin={() => openAuthModal("login")}
                    onRegister={() => openAuthModal("register")}
                />

                {/* 每日奖励通知 */}
                {dailyReward.show && (
                    <DailyRewardToast
                        amount={dailyReward.amount}
                        onClose={() => setDailyReward({ show: false, amount: 0 })}
                    />
                )}

                {/* 页面标题 */}
                <PageHeader />

                {/* 错误提示 */}
                {error && <ErrorBanner message={error} onDismiss={clearError} />}

                {/* 世界列表 */}
                <WorldsList worlds={worlds} onSelectWorld={handleSelectWorld} />
            </div>
        </PageContainer>
    );
}

// 子组件
interface TopNavigationProps {
    isAuthenticated: boolean;
    authLoading: boolean;
    user: { displayName: string } | null;
    onBack: () => void;
    onLogin: () => void;
    onRegister: () => void;
}

function TopNavigation({
    isAuthenticated,
    authLoading,
    user,
    onBack,
    onLogin,
    onRegister,
}: TopNavigationProps) {
    return (
        <div className="flex justify-between items-center mb-8">
            <button
                className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg cursor-pointer transition-all hover:bg-white/15 hover:border-white/30"
                onClick={onBack}
            >
                ← 返回主页
            </button>

            <div className="flex items-center gap-4">
                {authLoading ? (
                    <div className="w-8 h-8 border-2 border-white/20 border-t-cyan-500 rounded-full animate-spin" />
                ) : isAuthenticated && user ? (
                    <>
                        <CurrencyDisplay />
                        <UserInfo />
                    </>
                ) : (
                    <div className="flex gap-2">
                        <button
                            className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                            onClick={onLogin}
                        >
                            登录
                        </button>
                        <button
                            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all"
                            onClick={onRegister}
                        >
                            注册
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function PageHeader() {
    return (
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent mb-2">
                🌍 异世界探索
            </h1>
            <p className="text-white/60">
                发现由 AI 创造的奇幻世界，开启独一无二的旅程
            </p>
        </div>
    );
}

interface ErrorBannerProps {
    message: string;
    onDismiss: () => void;
}

function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
    return (
        <div
            className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-lg mb-6 cursor-pointer text-center max-w-xl mx-auto"
            onClick={onDismiss}
        >
            {message}（点击关闭）
        </div>
    );
}

interface World {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
    travelProjects?: { id: string }[];
    travelVehicle?: { name: string };
}

interface WorldsListProps {
    worlds: World[];
    onSelectWorld: (worldId: string) => void;
}

function WorldsList({ worlds, onSelectWorld }: WorldsListProps) {
    return (
        <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-semibold text-indigo-400 mb-4">已发现的世界</h2>

            {worlds.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {worlds.map((world) => (
                        <WorldCard
                            key={world.id}
                            world={world}
                            onClick={() => onSelectWorld(world.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-white/50 mb-2">还没有发现任何世界</p>
            <p className="text-white/50">请联系管理员创建世界后再来探索。</p>
        </div>
    );
}

interface WorldCardProps {
    world: World;
    onClick: () => void;
}

function WorldCard({ world, onClick }: WorldCardProps) {
    return (
        <div
            className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
            onClick={onClick}
        >
            {world.imageUrl ? (
                <img
                    src={world.imageUrl}
                    alt={world.name}
                    className="w-full h-44 object-cover"
                />
            ) : (
                <div className="w-full h-44 flex items-center justify-center bg-gradient-to-br from-[#2a2a4a] to-[#1a1a3a] text-6xl">
                    🌌
                </div>
            )}
            <div className="p-5">
                <h3 className="text-indigo-400 font-semibold mb-2">{world.name}</h3>
                <p className="text-white/60 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {world.description}
                </p>
                <div className="flex justify-between items-center text-xs text-white/40">
                    <span>{world.travelProjects?.length || 0} 个区域</span>
                    {world.travelVehicle && (
                        <span className="text-indigo-400">🚀 {world.travelVehicle.name}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
