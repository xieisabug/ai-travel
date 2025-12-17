import { useNavigate } from "react-router-dom";

interface StatItem {
    number: string;
    label: string;
}

interface WorldCard {
    id: number;
    name: string;
    desc: string;
    gradient: string;
    tag: string;
}

interface HeroSectionProps {
    worlds: WorldCard[];
    stats: StatItem[];
    activeWorld: number;
    isVisible: boolean;
    onWorldChange: (index: number) => void;
    onDemoClick: () => void;
}

export function HeroSection({
    worlds,
    stats,
    activeWorld,
    isVisible,
    onWorldChange,
    onDemoClick,
}: HeroSectionProps) {
    const navigate = useNavigate();

    return (
        <section
            className={`min-h-screen flex items-center justify-center gap-24 pt-40 pb-24 px-12 relative z-[1] transition-all duration-700 ease-out ${
                isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-5"
            }`}
        >
            {/* 版本标签 */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-sm text-white/80 mb-6">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                全新 2.0 版本现已上线
            </div>

            {/* 左侧文本内容 */}
            <div className="max-w-[600px]">
                <h1 className="text-7xl font-bold leading-[1.1] tracking-tight mb-6">
                    探索无限可能的
                    <br />
                    <span className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-400 bg-clip-text text-transparent">
                        虚拟世界
                    </span>
                </h1>
                <p className="text-xl text-white/60 leading-relaxed mb-10">
                    沉浸式的 AI 驱动旅行体验，让想象力带你去任何地方。
                    <br />
                    每个世界都是独一无二的冒险，每次探索都有新的发现。
                </p>
                <div className="flex gap-4 mb-12">
                    <button
                        className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-8 py-4 rounded-full text-base font-medium cursor-pointer transition-all flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)] group"
                        onClick={() => navigate("/worlds")}
                    >
                        <span>开始探索</span>
                        <ArrowRightIcon />
                    </button>
                    <button
                        className="bg-white/5 text-white border border-white/10 px-8 py-4 rounded-full text-base font-medium cursor-pointer transition-all flex items-center gap-3 hover:bg-white/10 hover:border-white/20"
                        onClick={onDemoClick}
                    >
                        <PlayIcon />
                        <span>观看演示</span>
                    </button>
                </div>
                <div className="flex gap-12 pt-8 border-t border-white/[0.08]">
                    {stats.map((stat, i) => (
                        <StatCard key={i} {...stat} />
                    ))}
                </div>
            </div>

            {/* 右侧卡片展示 */}
            <WorldCardsDisplay
                worlds={worlds}
                activeWorld={activeWorld}
                onWorldChange={onWorldChange}
            />
        </section>
    );
}

function StatCard({ number, label }: StatItem) {
    return (
        <div className="text-left">
            <div className="text-3xl font-bold bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
                {number}
            </div>
            <div className="text-sm text-white/50 mt-1">{label}</div>
        </div>
    );
}

interface WorldCardsDisplayProps {
    worlds: WorldCard[];
    activeWorld: number;
    onWorldChange: (index: number) => void;
}

function WorldCardsDisplay({ worlds, activeWorld, onWorldChange }: WorldCardsDisplayProps) {
    return (
        <div className="relative">
            <div className="relative w-[400px] h-[480px]">
                <div className="relative w-full h-full">
                    {worlds.map((world, i) => (
                        <div
                            key={world.id}
                            className={`absolute w-80 bg-gradient-to-br from-[rgba(30,30,40,0.9)] to-[rgba(20,20,30,0.9)] border border-white/10 rounded-3xl overflow-hidden transition-all duration-500 ease-out shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5),0_30px_60px_-30px_rgba(102,126,234,0.3)] ${
                                i === activeWorld
                                    ? "opacity-100 scale-100 translate-y-0 [transform:rotateY(-5deg)_rotateX(3deg)]"
                                    : "opacity-0 scale-90 translate-y-5"
                            }`}
                            style={
                                {
                                    "--card-gradient": world.gradient,
                                } as React.CSSProperties
                            }
                        >
                            <div
                                className="h-[200px] relative overflow-hidden"
                                style={{ background: world.gradient }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
                            </div>
                            <div className="p-6">
                                <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-medium mb-3">
                                    {world.tag}
                                </span>
                                <h3 className="text-xl font-semibold mb-2">
                                    {world.name}
                                </h3>
                                <p className="text-white/50 text-sm">
                                    {world.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                {/* 装饰圆环 */}
                <OrbitRings />
            </div>
            {/* 卡片指示器 */}
            <div className="flex gap-2 justify-center mt-8">
                {worlds.map((_, i) => (
                    <button
                        key={i}
                        className={`w-2 h-2 rounded-full border-none cursor-pointer transition-all ${
                            i === activeWorld
                                ? "bg-indigo-500 shadow-[0_0_12px_rgba(102,126,234,0.6)]"
                                : "bg-white/20"
                        }`}
                        onClick={() => onWorldChange(i)}
                    />
                ))}
            </div>
        </div>
    );
}

function OrbitRings() {
    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="absolute w-[300px] h-[300px] -top-[150px] -left-[150px] border border-indigo-500/10 rounded-full animate-spin-slow" />
            <div className="absolute w-[450px] h-[450px] -top-[225px] -left-[225px] border border-indigo-500/10 rounded-full animate-spin-slower-reverse" />
            <div className="absolute w-[600px] h-[600px] -top-[300px] -left-[300px] border border-indigo-500/10 rounded-full animate-spin-slowest" />
        </div>
    );
}

function ArrowRightIcon() {
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

function PlayIcon() {
    return (
        <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
    );
}

export type { WorldCard, StatItem };
