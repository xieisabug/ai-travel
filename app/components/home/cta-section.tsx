import { useNavigate } from "react-router-dom";

export function CTASection() {
    const navigate = useNavigate();

    return (
        <section className="py-32 px-12 relative z-[1] text-center overflow-hidden">
            {/* 内容 */}
            <div className="relative z-[2]">
                <h2 className="text-5xl font-bold mb-4">
                    准备好开始你的冒险了吗？
                </h2>
                <p className="text-white/60 text-xl mb-10">
                    加入超过 50 万探险者，开启属于你的虚拟旅程
                </p>
                <div className="flex flex-col items-center gap-4">
                    <button
                        className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-10 py-5 rounded-full text-lg font-medium cursor-pointer transition-all flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)] group"
                        onClick={() => navigate("/worlds")}
                    >
                        <span>立即开始</span>
                        <ArrowIcon />
                    </button>
                    <span className="text-sm text-white/40">
                        免费体验，无需信用卡
                    </span>
                </div>
            </div>

            {/* 背景装饰 */}
            <BackgroundBlurs />
        </section>
    );
}

function ArrowIcon() {
    return (
        <svg
            className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
    );
}

function BackgroundBlurs() {
    return (
        <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-[400px] h-[400px] bg-indigo-500/30 rounded-full blur-[80px] top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute w-[300px] h-[300px] bg-purple-600/30 rounded-full blur-[80px] top-[30%] right-[20%]" />
            <div className="absolute w-[250px] h-[250px] bg-pink-400/20 rounded-full blur-[80px] bottom-[20%] right-[30%]" />
        </div>
    );
}
