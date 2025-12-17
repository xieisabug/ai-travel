interface TravelingScreenProps {
    onArrive: () => void;
}

/**
 * 旅途中屏幕 - 显示旅途动画和到达按钮
 */
export function TravelingScreen({ onArrive }: TravelingScreenProps) {
    return (
        <div className="min-h-screen relative overflow-hidden bg-black">
            {/* 动态背景 */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-950/50 to-black animate-pulse" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.2),transparent)] pointer-events-none" />

            {/* 内容 */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 text-center text-white">
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
                    🌤️ 旅途中
                </h1>
                <p className="text-xl text-white/80 mb-8">
                    穿越时空的缝隙，前往未知的世界...
                </p>

                {/* 进度条 */}
                <ProgressBar progress={50} />

                {/* 到达按钮 */}
                <button
                    className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)]"
                    onClick={onArrive}
                >
                    抵达目的地
                </button>
            </div>
        </div>
    );
}

interface ProgressBarProps {
    progress: number;
}

function ProgressBar({ progress }: ProgressBarProps) {
    return (
        <div className="w-[300px] h-2.5 bg-white/20 rounded-full overflow-hidden my-8 shadow-lg">
            <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}

export type { TravelingScreenProps };
