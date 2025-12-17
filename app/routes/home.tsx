import { useState, useEffect } from "react";
import { PageContainer, Navbar, Footer } from "~/components/layout";
import { AuthModal } from "~/components/auth";
import { DailyRewardToast } from "~/components/daily-reward-toast";
import {
    HeroSection,
    WorldsShowcase,
    FeaturesSection,
    TestimonialsSection,
    CTASection,
    type WorldCard,
    type StatItem,
    type Testimonial,
} from "~/components/home";
import { useAuthContext } from "~/hooks/use-auth";
import type { LoginResponse } from "~/types/user";

// 静态数据
const worlds: WorldCard[] = [
    {
        id: 1,
        name: "云端之城",
        desc: "漂浮在天际的神秘都市",
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        tag: "热门",
    },
    {
        id: 2,
        name: "深海王国",
        desc: "探索未知的海底文明",
        gradient: "linear-gradient(135deg, #00c6fb 0%, #005bea 100%)",
        tag: "新上线",
    },
    {
        id: 3,
        name: "星际驿站",
        desc: "银河系边缘的补给站",
        gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        tag: "精选",
    },
    {
        id: 4,
        name: "古老森林",
        desc: "神秘生物栖息的魔法丛林",
        gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
        tag: "推荐",
    },
];

const stats: StatItem[] = [
    { number: "1000+", label: "独特世界" },
    { number: "50万+", label: "活跃探险者" },
    { number: "99.9%", label: "好评率" },
    { number: "24/7", label: "全天候服务" },
];

const testimonials: Testimonial[] = [
    {
        name: "李明",
        avatar: "🧑‍💻",
        role: "游戏设计师",
        content: "这是我体验过最沉浸式的虚拟旅行平台，每个世界都充满惊喜！",
    },
    {
        name: "张雪",
        avatar: "👩‍🎨",
        role: "插画师",
        content: "作为创作者，这里给了我无限的灵感，视觉效果简直太震撼了。",
    },
    {
        name: "王浩",
        avatar: "👨‍🚀",
        role: "科幻爱好者",
        content: "终于能亲身体验那些只存在于想象中的世界，太不可思议了！",
    },
];

const navLinks = [
    { href: "#worlds", label: "世界" },
    { href: "#features", label: "功能" },
    { href: "#testimonials", label: "评价" },
    { href: "#about", label: "关于" },
];

export default function Home() {
    const { isAuthenticated } = useAuthContext();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [activeWorld, setActiveWorld] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    // 每日奖励通知状态
    const [dailyReward, setDailyReward] = useState<{
        show: boolean;
        amount: number;
    }>({
        show: false,
        amount: 0,
    });

    // 关闭登录弹窗并处理每日奖励
    const handleAuthModalClose = (loginResponse?: LoginResponse) => {
        setIsLoginOpen(false);

        if (
            loginResponse?.dailyRewardClaimed &&
            loginResponse?.dailyRewardAmount
        ) {
            setDailyReward({
                show: true,
                amount: loginResponse.dailyRewardAmount,
            });
        }
    };

    useEffect(() => {
        setIsVisible(true);
        const interval = setInterval(() => {
            setActiveWorld((prev) => (prev + 1) % worlds.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <PageContainer>
            {/* 导航栏 */}
            <Navbar
                links={navLinks}
                showAuth={true}
                onLoginClick={() => setIsLoginOpen(true)}
            />

            {/* 主视觉区域 */}
            <HeroSection
                worlds={worlds}
                stats={stats}
                activeWorld={activeWorld}
                isVisible={isVisible}
                onWorldChange={setActiveWorld}
                onDemoClick={() => setIsLoginOpen(true)}
            />

            {/* 世界展示区域 */}
            <WorldsShowcase worlds={worlds} />

            {/* 特性区域 */}
            <FeaturesSection />

            {/* 用户评价 */}
            <TestimonialsSection testimonials={testimonials} />

            {/* CTA 区域 */}
            <CTASection />

            {/* 底部 */}
            <Footer />

            {/* 每日奖励通知 */}
            {dailyReward.show && (
                <DailyRewardToast
                    amount={dailyReward.amount}
                    onClose={() => setDailyReward({ show: false, amount: 0 })}
                />
            )}

            {/* 登录/注册弹窗 */}
            <AuthModal
                isOpen={isLoginOpen}
                onClose={handleAuthModalClose}
                defaultTab="login"
            />
        </PageContainer>
    );
}
