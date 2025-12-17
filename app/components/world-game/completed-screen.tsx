import type { TravelSession } from "~/types/world";

interface CompletedScreenProps {
    session: TravelSession | null;
    onExploreMore: () => void;
    onGoHome: () => void;
}

/**
 * 完成屏幕 - 显示旅程完成信息和统计
 */
export function CompletedScreen({
    session,
    onExploreMore,
    onGoHome,
}: CompletedScreenProps) {
    return (
        <div className="min-h-screen relative overflow-hidden bg-black">
            {/* 背景渐变 */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/30 via-purple-600/30 to-black" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.3),transparent)] pointer-events-none" />

            {/* 内容 */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 text-center text-white">
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
                    🎉 旅程完成！
                </h1>
                <p className="text-xl text-white/80 mb-8">
                    感谢您的这次异世界冒险
                </p>

                {/* 统计卡片 */}
                <StatsGrid session={session} />

                {/* 操作按钮 */}
                <ActionButtons onExploreMore={onExploreMore} onGoHome={onGoHome} />
            </div>
        </div>
    );
}

interface StatsGridProps {
    session: TravelSession | null;
}

function StatsGrid({ session }: StatsGridProps) {
    const stats = [
        {
            icon: "🗺️",
            label: "景点",
            value: session?.visitedSpots.length || 0,
        },
        {
            icon: "📸",
            label: "回忆",
            value: session?.memories.length || 0,
        },
        {
            icon: "🎁",
            label: "物品",
            value: session?.items.length || 0,
        },
    ];

    return (
        <div className="flex flex-wrap justify-center gap-6 my-8">
            {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
            ))}
        </div>
    );
}

interface StatCardProps {
    icon: string;
    label: string;
    value: number;
}

function StatCard({ icon, label, value }: StatCardProps) {
    return (
        <div className="flex flex-col items-center bg-black/40 backdrop-blur-xl px-8 py-6 rounded-2xl border border-white/10 transition-all hover:-translate-y-1 hover:shadow-xl">
            <span className="text-4xl mb-2">{icon}</span>
            <span className="text-sm text-white/60 mb-1">{label}</span>
            <span className="text-3xl font-bold text-indigo-400">{value}</span>
        </div>
    );
}

interface ActionButtonsProps {
    onExploreMore: () => void;
    onGoHome: () => void;
}

function ActionButtons({ onExploreMore, onGoHome }: ActionButtonsProps) {
    return (
        <div className="flex flex-col gap-4 mt-8">
            <button
                className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)]"
                onClick={onExploreMore}
            >
                🌍 探索更多世界
            </button>
            <button
                className="bg-white/10 text-white border-2 border-white/30 px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all hover:bg-white/15 hover:border-white/50"
                onClick={onGoHome}
            >
                🏠 返回首页
            </button>
        </div>
    );
}

export type { CompletedScreenProps };
