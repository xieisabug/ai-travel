export function FeaturesSection() {
    return (
        <section
            id="features"
            className="py-32 px-12 relative z-[1] bg-gradient-to-b from-transparent via-[rgba(10,10,15,0.8)] to-transparent"
        >
            <SectionHeader
                tag="核心功能"
                title="为什么选择我们"
                description="每一次旅程都是独一无二的体验"
            />

            <div className="grid grid-cols-3 gap-6 max-w-[1200px] mx-auto">
                {/* 主特性卡片 - 跨三列 */}
                <MainFeatureCard />

                {/* 小型特性卡片 */}
                <FeatureCard
                    icon={<LayersIcon />}
                    title="无限世界"
                    description="从奇幻王国到科幻宇宙，每个世界都有独特的风景、文化和故事等你发现。新世界持续更新中。"
                />
                <FeatureCard
                    icon={<UsersIcon />}
                    title="遇见角色"
                    description="与形形色色的虚拟居民交流互动，每个角色都有自己的故事、性格和秘密等你发掘。"
                />
                <FeatureCard
                    icon={<FlagIcon />}
                    title="完成任务"
                    description="接受挑战，完成任务，解锁隐藏内容。每个世界都有独特的成就系统等你征服。"
                />
                <FeatureCard
                    icon={<ImageIcon />}
                    title="视觉盛宴"
                    description="AI 生成的精美场景图片，让每一帧都如同艺术品。支持多种风格，从写实到动漫应有尽有。"
                />
                <FeatureCard
                    icon={<ShieldIcon />}
                    title="安全可靠"
                    description="您的数据安全是我们的首要任务。采用企业级加密，确保您的旅程记录完全私密。"
                />
            </div>
        </section>
    );
}

function SectionHeader({ tag, title, description }: { tag: string; title: string; description: string }) {
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

function MainFeatureCard() {
    return (
        <div className="col-span-3 grid grid-cols-2 gap-12 p-12 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] rounded-[20px] transition-all hover:bg-gradient-to-br hover:from-white/[0.05] hover:to-white/[0.02] hover:border-white/10 hover:-translate-y-1">
            {/* 对话演示 */}
            <div className="flex items-center justify-center">
                <ChatDemo />
            </div>

            {/* 特性描述 */}
            <div className="flex flex-col justify-center">
                <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mb-6">
                    <CheckCircleIcon />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                    AI 驱动的沉浸式体验
                </h3>
                <p className="text-white/50 text-[15px] leading-relaxed">
                    每个世界都由先进的 AI
                    技术构建，角色拥有独特的个性和记忆。与他们交流，体验真正的互动故事。
                </p>
                <ul className="list-none p-0 mt-6 space-y-2">
                    <FeatureListItem text="智能对话系统" />
                    <FeatureListItem text="动态故事生成" />
                    <FeatureListItem text="个性化冒险路线" />
                </ul>
            </div>
        </div>
    );
}

function ChatDemo() {
    return (
        <div className="w-full max-w-[400px]">
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl overflow-hidden border border-white/10">
                {/* 窗口标题栏 */}
                <div className="h-10 bg-black/30 flex items-center px-4 gap-2">
                    <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500/60" />
                        <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                        <span className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                </div>
                {/* 对话内容 */}
                <div className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4" />
                    <div className="flex flex-col gap-3">
                        <div className="px-4 py-3 bg-white/10 rounded-2xl rounded-bl-sm text-sm max-w-[80%]">
                            你好，旅行者！欢迎来到云端之城。
                        </div>
                        <div className="px-4 py-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl rounded-br-sm text-sm max-w-[80%] self-end">
                            这里真的太美了！
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureListItem({ text }: { text: string }) {
    return (
        <li className="flex items-center gap-3 text-white/70 text-[15px]">
            <span className="w-5 h-5 flex items-center justify-center bg-indigo-500/20 text-indigo-400 rounded-full text-xs">
                ✓
            </span>
            {text}
        </li>
    );
}

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
    return (
        <div className="p-8 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] rounded-[20px] transition-all hover:bg-gradient-to-br hover:from-white/[0.05] hover:to-white/[0.02] hover:border-white/10 hover:-translate-y-1">
            <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-semibold mb-3">{title}</h3>
            <p className="text-white/50 text-[15px] leading-relaxed">
                {description}
            </p>
        </div>
    );
}

// Icons
function CheckCircleIcon() {
    return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path d="M9 12l2 2 4-4" />
        </svg>
    );
}

function LayersIcon() {
    return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
    );
}

function UsersIcon() {
    return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
    );
}

function FlagIcon() {
    return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
    );
}

function ImageIcon() {
    return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
        </svg>
    );
}

function ShieldIcon() {
    return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    );
}
