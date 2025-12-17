interface FooterLink {
    href: string;
    label: string;
}

interface FooterColumn {
    title: string;
    links: FooterLink[];
}

interface SocialLink {
    href: string;
    icon: React.ReactNode;
    label: string;
}

const defaultColumns: FooterColumn[] = [
    {
        title: "产品",
        links: [
            { href: "#worlds", label: "世界探索" },
            { href: "#features", label: "功能介绍" },
            { href: "#", label: "定价方案" },
            { href: "#", label: "更新日志" },
        ],
    },
    {
        title: "公司",
        links: [
            { href: "#about", label: "关于我们" },
            { href: "#", label: "加入团队" },
            { href: "#", label: "媒体报道" },
            { href: "#", label: "联系我们" },
        ],
    },
    {
        title: "支持",
        links: [
            { href: "#", label: "帮助中心" },
            { href: "#", label: "社区论坛" },
            { href: "#", label: "API 文档" },
            { href: "#", label: "服务状态" },
        ],
    },
    {
        title: "法律",
        links: [
            { href: "#", label: "隐私政策" },
            { href: "#", label: "服务条款" },
            { href: "#", label: "Cookie 政策" },
            { href: "#", label: "许可协议" },
        ],
    },
];

const defaultSocialLinks: SocialLink[] = [
    {
        href: "#",
        label: "Twitter",
        icon: (
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
    },
    {
        href: "#",
        label: "GitHub",
        icon: (
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
        ),
    },
    {
        href: "#",
        label: "Discord",
        icon: (
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
            </svg>
        ),
    },
];

export interface FooterProps {
    columns?: FooterColumn[];
    socialLinks?: SocialLink[];
    copyright?: string;
}

export function Footer({
    columns = defaultColumns,
    socialLinks = defaultSocialLinks,
    copyright = "© 2024 Wanderlust. All rights reserved.",
}: FooterProps) {
    return (
        <footer className="pt-20 pb-8 px-12 bg-black/50 border-t border-white/[0.06] relative z-[1]">
            <div className="grid grid-cols-[1.5fr_2fr] gap-16 max-w-[1200px] mx-auto mb-16">
                {/* 品牌信息 */}
                <div>
                    <div className="text-2xl font-semibold mb-3 flex items-center gap-2">
                        <span className="text-2xl bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                            ✦
                        </span>
                        云旅游
                    </div>
                    <p className="text-white/40 text-[15px] mb-6">
                        让想象力带你去任何地方
                    </p>
                    <div className="flex gap-4">
                        {socialLinks.map((social, index) => (
                            <a
                                key={index}
                                href={social.href}
                                aria-label={social.label}
                                className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-[10px] text-white/60 transition-all hover:bg-white/10 hover:text-white"
                            >
                                {social.icon}
                            </a>
                        ))}
                    </div>
                </div>

                {/* 链接列 */}
                <div className="grid grid-cols-4 gap-8">
                    {columns.map((column, index) => (
                        <div key={index}>
                            <h4 className="text-sm font-semibold mb-4 text-white/90">
                                {column.title}
                            </h4>
                            {column.links.map((link, linkIndex) => (
                                <a
                                    key={linkIndex}
                                    href={link.href}
                                    className="block text-white/50 text-sm py-1.5 transition-colors hover:text-white"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* 底部版权信息 */}
            <div className="flex justify-between items-center pt-8 border-t border-white/[0.06] max-w-[1200px] mx-auto">
                <p className="text-white/30 text-[13px]">{copyright}</p>
                <div className="flex items-center gap-2 text-white/50 text-sm">
                    <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                    </svg>
                    <span>简体中文</span>
                </div>
            </div>
        </footer>
    );
}
