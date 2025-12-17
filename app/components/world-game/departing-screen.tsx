interface DepartingScreenProps {
    comicImage: string;
    revealed: boolean;
    shown: boolean;
    onReveal: () => void;
}

/**
 * 出发屏幕 - 显示出发漫画和开始按钮
 */
export function DepartingScreen({
    comicImage,
    revealed,
    shown,
    onReveal,
}: DepartingScreenProps) {
    return (
        <div className="min-h-screen relative overflow-hidden bg-black">
            {/* 背景渐变 */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-indigo-950/50 to-purple-900/30" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.2),transparent)] pointer-events-none" />

            {/* 内容区域 */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 text-center text-white">
                {/* 漫画容器 */}
                <ComicDisplay
                    image={comicImage}
                    revealed={revealed}
                />

                {/* 开始按钮 */}
                <button
                    className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-8 py-4 absolute rounded-full text-lg font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={onReveal}
                    disabled={shown}
                >
                    {shown ? "准备中..." : "开始旅程"}
                </button>
            </div>
        </div>
    );
}

interface ComicDisplayProps {
    image: string;
    revealed: boolean;
}

function ComicDisplay({ image, revealed }: ComicDisplayProps) {
    return (
        <div className="relative max-w-3xl w-full mx-auto mb-10 overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <img
                src={image}
                alt="Departure comic"
                className="w-full h-full object-cover"
            />
            {/* 遮罩层 */}
            <div
                className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent transition-all duration-700 ease-out ${
                    revealed ? "h-0 opacity-0" : "h-[68%] opacity-100"
                }`}
            />
            <div
                className={`absolute inset-x-0 bottom-0 bg-black/90 backdrop-blur-[2px] transition-all duration-700 ease-out ${
                    revealed ? "h-0 opacity-0" : "h-[68%] opacity-100"
                }`}
            />
        </div>
    );
}

export type { DepartingScreenProps };
