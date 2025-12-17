import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthModal } from "~/components/auth-modal";
import { DailyRewardToast } from "~/components/daily-reward-toast";
import {
    CardStack,
    FeatureGrid,
    FloatingParticles,
    GlowButton,
    HighlightText,
    ImageCard,
    ImageBadge,
    LoadingScreen,
    ErrorScreen,
    PageBackground,
    ProjectCarousel,
    SectionHeader,
} from "~/components/ui";
import { useAuthContext } from "~/hooks/use-auth";
import { useWorlds } from "~/hooks/use-worlds";
import { USER_ROLE_NAMES, type LoginResponse } from "~/types/user";

type ViewState = "detail" | "preparing";

export default function WorldDetailPage() {
    const { worldId } = useParams();
    const navigate = useNavigate();
    const {
        currentWorld,
        projects,
        isLoading,
        isGenerating,
        error,
        clearError,
        selectWorld,
        selectProject,
        createSession,
    } = useWorlds();

    const { user, isAuthenticated, refreshUser } = useAuthContext();

    const [viewState, setViewState] = useState<ViewState>("detail");
    const [preparingMessage, setPreparingMessage] = useState("");
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalTab, setAuthModalTab] = useState<"login" | "register">(
        "login"
    );
    const [dailyReward, setDailyReward] = useState<{
        show: boolean;
        amount: number;
    }>({
        show: false,
        amount: 0,
    });
    const [scrollY, setScrollY] = useState(0);
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (!worldId) return;
        if (currentWorld && currentWorld.id === worldId) return;

        void selectWorld(worldId);
    }, [currentWorld, selectWorld, worldId]);

    const openAuthModal = (tab: "login" | "register" = "login") => {
        setAuthModalTab(tab);
        setShowAuthModal(true);
    };

    const handleAuthModalClose = (loginResponse?: LoginResponse) => {
        setShowAuthModal(false);
        refreshUser();

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

    const handleStartTravel = async () => {
        if (!currentWorld) return;

        if (!isAuthenticated || !user) {
            openAuthModal("login");
            return;
        }

        const playerName = user.displayName;

        setPreparingMessage("正在准备您的旅程...");
        setViewState("preparing");

        const firstProject = currentWorld.travelProjects?.[0];
        if (firstProject && firstProject.generationStatus !== "ready") {
            setPreparingMessage("正在生成旅行目的地详情...");
            const updatedProject = await selectProject(firstProject.id);
            if (!updatedProject) {
                setPreparingMessage("详情生成失败，请重试");
                setTimeout(() => setViewState("detail"), 2000);
                return;
            }
        }

        const projectId =
            firstProject?.id || currentWorld.travelProjects?.[0]?.id;
        if (!projectId) {
            setPreparingMessage("没有可用的区域");
            setTimeout(() => setViewState("detail"), 2000);
            return;
        }

        const session = await createSession(projectId, playerName);
        if (session) {
            navigate(`/world-game?session=${session.id}`);
        } else {
            setViewState("detail");
        }
    };

    const handleBack = () => {
        navigate("/worlds");
    };

    // Loading state
    if (isLoading && !currentWorld) {
        return <LoadingScreen message="探索世界中..." />;
    }

    // Not found state
    if (!currentWorld) {
        return (
            <ErrorScreen
                title="世界已消失在迷雾中..."
                message={error || undefined}
                actionText="← 返回世界列表"
                onAction={handleBack}
            />
        );
    }

    // Preparing state
    if (viewState === "preparing") {
        return (
            <PageBackground backgroundImage={currentWorld.imageUrl}>
                <div className="min-h-screen flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="w-20 h-20 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-8" />
                        <h2 className="text-3xl font-bold mb-4 text-amber-100">
                            {preparingMessage}
                        </h2>
                        <div className="mt-8 p-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-amber-500/20 max-w-md mx-auto">
                            <h3 className="text-amber-400 font-semibold text-xl mb-3">
                                {currentWorld.name}
                            </h3>
                            <p className="text-white/60 text-sm leading-relaxed">
                                {currentWorld.description}
                            </p>
                        </div>
                    </div>
                </div>
            </PageBackground>
        );
    }

    // Collect all gallery images
    const allGalleryImages = [
        ...(currentWorld.overviewImages || []),
        ...(currentWorld.cultureImages || []),
    ].filter(Boolean);

    // Build feature cards data
    const featureCards = [
        currentWorld.geography && {
            icon: "🏔️",
            label: "地理",
            content: currentWorld.geography,
            theme: "amber" as const,
        },
        currentWorld.climate && {
            icon: "🌤️",
            label: "气候",
            content: currentWorld.climate,
            theme: "cyan" as const,
        },
        currentWorld.culture && {
            icon: "🎭",
            label: "文化",
            content: currentWorld.culture,
            theme: "purple" as const,
        },
        currentWorld.cuisine && {
            icon: "🍜",
            label: "美食",
            content: currentWorld.cuisine,
            theme: "orange" as const,
        },
    ].filter(Boolean) as Array<{
        icon: string;
        label: string;
        content: string;
        theme: "amber" | "cyan" | "purple" | "orange";
    }>;

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            {/* ============================================
          IMMERSIVE HERO SECTION
          ============================================ */}
            <section
                ref={heroRef}
                className="relative h-screen overflow-hidden"
            >
                {/* Background Image with Parallax */}
                <div
                    className="absolute inset-0 scale-110"
                    style={{
                        transform: `translateY(${scrollY * 0.3}px) scale(1.1)`,
                    }}
                >
                    {currentWorld.imageUrl ? (
                        <img
                            src={currentWorld.imageUrl}
                            alt={currentWorld.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900" />
                    )}
                </div>

                {/* Overlay Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/60 via-transparent to-[#0a0a0f]/60" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_20%,transparent,rgba(10,10,15,0.8))]" />

                {/* Floating Particles Effect */}
                <FloatingParticles count={20} color="amber" />

                {/* Top Navigation Bar */}
                <nav className="absolute top-0 left-0 right-0 z-50 p-6">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <GlowButton
                            variant="ghost"
                            size="sm"
                            theme="amber"
                            onClick={handleBack}
                        >
                            <span className="transform group-hover:-translate-x-1 transition-transform">
                                ←
                            </span>
                            <span className="text-sm">返回世界列表</span>
                        </GlowButton>
                        {error && (
                            <div
                                className="bg-red-500/20 backdrop-blur-md border border-red-500/50 text-red-300 px-4 py-2 rounded-full text-sm cursor-pointer"
                                onClick={clearError}
                            >
                                {error}
                            </div>
                        )}
                    </div>
                </nav>

                {/* Hero Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center max-w-4xl mx-auto px-6">
                        {/* World Tags */}
                        {currentWorld.tags && currentWorld.tags.length > 0 && (
                            <div
                                className="flex flex-wrap justify-center gap-2 mb-6 animate-fade-in-up"
                                style={{ animationDelay: "0.1s" }}
                            >
                                {currentWorld.tags
                                    .slice(0, 4)
                                    .map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1 bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 rounded-full text-amber-300 text-xs font-medium tracking-wide"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                            </div>
                        )}

                        {/* World Title */}
                        <h1
                            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4 animate-fade-in-up"
                            style={{ animationDelay: "0.2s" }}
                        >
                            <span className="bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_4px_30px_rgba(245,158,11,0.3)]">
                                {currentWorld.name}
                            </span>
                        </h1>

                        {/* Subtitle */}
                        {currentWorld.subtitle && (
                            <p
                                className="text-xl md:text-2xl text-amber-100/80 font-light tracking-wide mb-6 animate-fade-in-up"
                                style={{ animationDelay: "0.3s" }}
                            >
                                {currentWorld.subtitle}
                            </p>
                        )}

                        {/* Description */}
                        <p
                            className="text-white/60 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-in-up"
                            style={{ animationDelay: "0.4s" }}
                        >
                            {currentWorld.description}
                        </p>

                        {/* CTA Button */}
                        <div
                            className="animate-fade-in-up"
                            style={{ animationDelay: "0.5s" }}
                        >
                            <GlowButton
                                size="lg"
                                theme="amber"
                                icon="🚀"
                                loading={isGenerating}
                                onClick={handleStartTravel}
                            >
                                {isGenerating ? "准备中..." : "开始探索"}
                            </GlowButton>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
                        <div className="w-1 h-2 bg-white/50 rounded-full animate-pulse" />
                    </div>
                </div>

                {/* Decorative Bottom Curve */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
            </section>

            {/* ============================================
          MAIN CONTENT AREA
          ============================================ */}
            <main className="relative z-10">
                {/* ============================================
            WHAT IS THIS WORLD - Introduction Section
            ============================================ */}
                <section className="relative py-24 overflow-hidden">
                    {/* Background Decorations */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_50%_at_20%_0%,rgba(139,92,246,0.08),transparent)] pointer-events-none" />
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            {/* Text Content */}
                            <div className="space-y-8">
                                <div>
                                    <SectionHeader
                                        label="世界概况"
                                        title={
                                            <>
                                                这是一个怎样的
                                                <HighlightText>
                                                    世界
                                                </HighlightText>
                                                ？
                                            </>
                                        }
                                        theme="amber"
                                        className="mb-6"
                                    />
                                    <p className="text-white/60 text-lg leading-relaxed">
                                        {currentWorld.detailedDescription ||
                                            currentWorld.description}
                                    </p>
                                </div>

                                {/* Feature List */}
                                {featureCards.length > 0 && (
                                    <FeatureGrid
                                        features={featureCards}
                                        columns={2}
                                    />
                                )}
                            </div>

                            {/* Card Stack Image Gallery */}
                            <CardStack
                                images={allGalleryImages}
                                fallbackImage={currentWorld.imageUrl}
                                title={currentWorld.name}
                                subtitle={currentWorld.era || "神秘纪元"}
                            />
                        </div>
                    </div>
                </section>

                {/* ============================================
            IMAGE GALLERY SECTION - Masonry Style
            ============================================ */}
                {allGalleryImages.length > 0 && (
                    <section className="relative py-24 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.02] to-transparent pointer-events-none" />

                        <div className="max-w-7xl mx-auto px-6">
                            <SectionHeader
                                label="画廊"
                                title={
                                    <>
                                        世界<HighlightText>掠影</HighlightText>
                                    </>
                                }
                                description="探索这个世界的地貌风光与人文风情"
                                theme="amber"
                                align="center"
                                className="mb-16"
                            />

                            {/* Masonry Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {/* Large Featured Image */}
                                {allGalleryImages[0] && (
                                    <div className="col-span-2 row-span-2">
                                        <ImageCard
                                            src={allGalleryImages[0]}
                                            alt="Gallery 1"
                                            size="featured"
                                            theme="amber"
                                            badge={
                                                <ImageBadge
                                                    icon="🌍"
                                                    text="地貌风光"
                                                    theme="amber"
                                                />
                                            }
                                        />
                                    </div>
                                )}

                                {/* Smaller Images */}
                                {allGalleryImages
                                    .slice(1, 5)
                                    .map((img, idx) => (
                                        <ImageCard
                                            key={idx}
                                            src={img}
                                            alt={`Gallery ${idx + 2}`}
                                            size="sm"
                                            theme="amber"
                                        />
                                    ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ============================================
            TRAVEL VEHICLE SECTION - Featured Showcase
            ============================================ */}
                {currentWorld.travelVehicle && (
                    <section className="relative py-24 overflow-hidden">
                        {/* Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.03] via-transparent to-purple-500/[0.03] pointer-events-none" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="max-w-7xl mx-auto px-6">
                            <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#1a1a2e]/80 to-[#0a0a0f]/80 backdrop-blur-xl border border-amber-500/20">
                                {/* Decorative Elements */}
                                <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
                                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

                                <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-0">
                                    {/* Vehicle Image */}
                                    {currentWorld.travelVehicle.image && (
                                        <div className="relative h-80 lg:h-auto lg:min-h-[500px] overflow-hidden">
                                            <img
                                                src={
                                                    currentWorld.travelVehicle
                                                        .image
                                                }
                                                alt={
                                                    currentWorld.travelVehicle
                                                        .name
                                                }
                                                className="absolute inset-0 w-full h-full object-cover lg:object-contain p-8"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1a1a2e] lg:bg-gradient-to-l" />
                                        </div>
                                    )}

                                    {/* Vehicle Info */}
                                    <div className="relative p-8 lg:p-12 flex flex-col justify-center">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-full w-fit mb-6">
                                            <span className="text-amber-400">
                                                ✨
                                            </span>
                                            <span className="text-amber-300 text-sm font-medium">
                                                旅行器
                                            </span>
                                        </div>

                                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                            {currentWorld.travelVehicle.name}
                                        </h3>

                                        <p className="text-white/60 text-lg leading-relaxed mb-8">
                                            {
                                                currentWorld.travelVehicle
                                                    .description
                                            }
                                        </p>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white/[0.04] rounded-xl p-4 border border-white/5">
                                                <div className="text-white/40 text-xs uppercase tracking-wide mb-1">
                                                    类型
                                                </div>
                                                <div className="text-white font-medium">
                                                    {
                                                        currentWorld
                                                            .travelVehicle.type
                                                    }
                                                </div>
                                            </div>
                                            <div className="bg-white/[0.04] rounded-xl p-4 border border-white/5">
                                                <div className="text-white/40 text-xs uppercase tracking-wide mb-1">
                                                    速度
                                                </div>
                                                <div className="text-white font-medium">
                                                    {currentWorld.travelVehicle
                                                        .speed || "神秘速度"}
                                                </div>
                                            </div>
                                            <div className="bg-white/[0.04] rounded-xl p-4 border border-white/5">
                                                <div className="text-white/40 text-xs uppercase tracking-wide mb-1">
                                                    载客量
                                                </div>
                                                <div className="text-white font-medium">
                                                    {
                                                        currentWorld
                                                            .travelVehicle
                                                            .capacity
                                                    }{" "}
                                                    人
                                                </div>
                                            </div>
                                            <div className="bg-white/[0.04] rounded-xl p-4 border border-white/5">
                                                <div className="text-white/40 text-xs uppercase tracking-wide mb-1">
                                                    舒适度
                                                </div>
                                                <div className="text-amber-400 font-medium">
                                                    {"★".repeat(
                                                        currentWorld
                                                            .travelVehicle
                                                            .comfortLevel
                                                    )}
                                                    {"☆".repeat(
                                                        5 -
                                                            currentWorld
                                                                .travelVehicle
                                                                .comfortLevel
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ============================================
            TRAVEL PROJECTS SECTION - Interactive Carousel
            ============================================ */}
                <section className="relative py-24 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_50%_at_80%_100%,rgba(139,92,246,0.08),transparent)] pointer-events-none" />

                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
                            <SectionHeader
                                label="探索行程"
                                title={
                                    <>
                                        精彩
                                        <HighlightText theme="cyan">
                                            旅程
                                        </HighlightText>
                                    </>
                                }
                                description={`本次旅行包含 ${projects.length} 个精彩区域`}
                                theme="cyan"
                            />

                            {/* Navigation Hint */}
                            <div className="flex items-center gap-2 text-white/40 text-sm">
                                <span>← 滑动浏览 →</span>
                            </div>
                        </div>

                        {/* Horizontal Scroll Cards */}
                        <ProjectCarousel projects={projects} theme="cyan" />
                    </div>
                </section>

                {/* ============================================
            CALL TO ACTION - Beta Sign-up Style
            ============================================ */}
                <section className="relative py-32 overflow-hidden">
                    {/* Background */}
                    <div className="absolute inset-0">
                        {currentWorld.imageUrl && (
                            <img
                                src={currentWorld.imageUrl}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover opacity-10"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/90 to-[#0a0a0f]" />
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
                        <h2 className="text-4xl md:text-6xl font-bold mb-6">
                            <HighlightText>准备</HighlightText>
                            <span className="text-white">启程</span>
                        </h2>

                        <p className="text-white/60 text-lg md:text-xl mb-10 leading-relaxed">
                            搭乘{" "}
                            <span className="text-amber-400 font-medium">
                                {currentWorld.travelVehicle?.name ||
                                    "神秘旅行器"}
                            </span>
                            ， 开启您的异世界探索之旅
                        </p>

                        {isAuthenticated && user ? (
                            <div className="space-y-8">
                                {/* User Card */}
                                <div className="inline-flex items-center gap-4 bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-full px-6 py-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-amber-500/30">
                                        {user.displayName
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-white font-medium">
                                            {user.displayName}
                                        </div>
                                        <div className="text-xs text-amber-400/80">
                                            {USER_ROLE_NAMES[user.role]}
                                        </div>
                                    </div>
                                </div>

                                {/* Start Button */}
                                <div>
                                    <GlowButton
                                        size="xl"
                                        theme="amber"
                                        icon="🚀"
                                        loading={isGenerating}
                                        onClick={handleStartTravel}
                                    >
                                        {isGenerating
                                            ? "准备中..."
                                            : "立即启程"}
                                    </GlowButton>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <p className="text-white/40">
                                    登录后即可开始旅行
                                </p>
                                <GlowButton
                                    size="lg"
                                    theme="cyan"
                                    onClick={() => openAuthModal("login")}
                                >
                                    登录 / 注册
                                </GlowButton>
                            </div>
                        )}
                    </div>
                </section>

                {/* ============================================
            FOOTER
            ============================================ */}
                <footer className="relative py-12 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-2xl font-bold text-amber-400">
                                {currentWorld.name}
                            </div>
                            <div className="text-white/30 text-sm">
                                © 2024 AI Travel. 探索无限可能
                            </div>
                        </div>
                    </div>
                </footer>
            </main>

            {dailyReward.show && (
                <DailyRewardToast
                    amount={dailyReward.amount}
                    onClose={() => setDailyReward({ show: false, amount: 0 })}
                />
            )}

            <AuthModal
                isOpen={showAuthModal}
                onClose={handleAuthModalClose}
                defaultTab={authModalTab}
            />
        </div>
    );
}
