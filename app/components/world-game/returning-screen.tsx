import type { TravelSession } from "~/types/world";

interface ReturningScreenProps {
    session: TravelSession | null;
    onComplete: () => void;
}

/**
 * 返程屏幕 - 显示旅途回忆和完成按钮
 */
export function ReturningScreen({ session, onComplete }: ReturningScreenProps) {
    return (
        <div className="min-h-screen relative overflow-hidden bg-black">
            {/* 背景渐变 */}
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/30 via-pink-500/30 to-purple-900/50" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.2),transparent)] pointer-events-none" />

            {/* 内容 */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 text-center text-white">
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
                    🌅 返程
                </h1>
                <p className="text-xl text-white/80 mb-8">
                    带着美好的回忆踏上归途...
                </p>

                {/* 旅途统计 */}
                <TripSummary session={session} />

                {/* 完成按钮 */}
                <button
                    className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)]"
                    onClick={onComplete}
                >
                    完成旅程
                </button>
            </div>
        </div>
    );
}

interface TripSummaryProps {
    session: TravelSession | null;
}

function TripSummary({ session }: TripSummaryProps) {
    return (
        <div className="bg-black/50 backdrop-blur-xl p-8 rounded-2xl mb-8 border border-white/10">
            <h3 className="text-indigo-400 font-semibold text-xl mb-4">
                旅途回忆
            </h3>
            <p className="text-white/70 mb-2">
                访问了 {session?.visitedSpots.length || 0} 个景点
            </p>
            <p className="text-white/70">
                收集了 {session?.memories.length || 0} 个回忆
            </p>
        </div>
    );
}

export type { ReturningScreenProps };
