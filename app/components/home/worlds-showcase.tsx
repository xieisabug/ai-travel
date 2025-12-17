import { useNavigate } from "react-router-dom";
import type { WorldCard } from "./hero-section";

interface WorldsShowcaseProps {
    worlds: WorldCard[];
}

export function WorldsShowcase({ worlds }: WorldsShowcaseProps) {
    const navigate = useNavigate();

    return (
        <section id="worlds" className="py-32 px-12 relative z-[1]">
            <SectionHeader
                tag="精选世界"
                title="发现令人惊叹的目的地"
                description="每个世界都由 AI 精心构建，拥有独特的故事、角色和冒险"
            />

            <div className="grid grid-cols-4 gap-6 max-w-[1400px] mx-auto">
                {worlds.map((world, i) => (
                    <WorldCard
                        key={world.id}
                        world={world}
                        index={i}
                        onEnter={() => navigate("/worlds")}
                    />
                ))}
            </div>

            <div className="flex justify-center mt-12">
                <button
                    className="bg-transparent text-white border border-white/20 px-8 py-4 rounded-full text-base font-medium cursor-pointer transition-all flex items-center gap-2 hover:bg-white/5 hover:border-white/30 group"
                    onClick={() => navigate("/worlds")}
                >
                    查看全部世界
                    <ArrowIcon />
                </button>
            </div>
        </section>
    );
}

interface SectionHeaderProps {
    tag: string;
    title: string;
    description: string;
}

function SectionHeader({ tag, title, description }: SectionHeaderProps) {
    return (
        <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-sm text-indigo-400 font-medium mb-4">
                {tag}
            </span>
            <h2 className="text-5xl font-bold tracking-tight mb-4">{title}</h2>
            <p className="text-white/50 text-lg max-w-[600px] mx-auto">
                {description}
            </p>
        </div>
    );
}

interface WorldCardProps {
    world: WorldCard;
    index: number;
    onEnter: () => void;
}

function WorldCard({ world, index, onEnter }: WorldCardProps) {
    return (
        <div
            className="bg-gradient-to-br from-[rgba(30,30,40,0.6)] to-[rgba(20,20,30,0.6)] border border-white/[0.06] rounded-[20px] overflow-hidden transition-all duration-400 ease-out hover:-translate-y-2 hover:border-indigo-500/30 hover:shadow-[0_30px_60px_rgba(0,0,0,0.3)] animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            <div
                className="h-[180px] relative overflow-hidden"
                style={{ background: world.gradient }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(0,0,0,0)] to-black/80" />
                <span className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs font-medium">
                    {world.tag}
                </span>
            </div>
            <div className="p-5">
                <h3 className="text-lg font-semibold mb-2">{world.name}</h3>
                <p className="text-white/50 text-sm mb-4">{world.desc}</p>
                <button
                    className="flex items-center gap-2 bg-transparent border-none text-indigo-400 text-sm font-medium cursor-pointer p-0 transition-all hover:gap-3 group"
                    onClick={onEnter}
                >
                    进入世界
                    <ArrowIcon small />
                </button>
            </div>
        </div>
    );
}

function ArrowIcon({ small = false }: { small?: boolean }) {
    return (
        <svg
            className={`${small ? "w-4 h-4" : "w-[18px] h-[18px]"} transition-transform group-hover:translate-x-1`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
    );
}
