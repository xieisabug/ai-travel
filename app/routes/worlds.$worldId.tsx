import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthModal } from '~/components/AuthModal';
import { DailyRewardToast } from '~/components/DailyRewardToast';
import { useAuthContext } from '~/hooks/useAuth';
import { useWorlds } from '~/hooks/useWorlds';
import { USER_ROLE_NAMES, type LoginResponse } from '~/types/user';

type ViewState = 'detail' | 'preparing';

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

  const [viewState, setViewState] = useState<ViewState>('detail');
  const [preparingMessage, setPreparingMessage] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [dailyReward, setDailyReward] = useState<{ show: boolean; amount: number }>({
    show: false,
    amount: 0,
  });
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!worldId) return;
    if (currentWorld && currentWorld.id === worldId) return;

    void selectWorld(worldId);
  }, [currentWorld, selectWorld, worldId]);

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setShowAuthModal(true);
  };

  const handleAuthModalClose = (loginResponse?: LoginResponse) => {
    setShowAuthModal(false);
    refreshUser();

    if (loginResponse?.dailyRewardClaimed && loginResponse?.dailyRewardAmount) {
      setDailyReward({ show: true, amount: loginResponse.dailyRewardAmount });
    }
  };

  const handleStartTravel = async () => {
    if (!currentWorld) return;

    if (!isAuthenticated || !user) {
      openAuthModal('login');
      return;
    }

    const playerName = user.displayName;

    setPreparingMessage('正在准备您的旅程...');
    setViewState('preparing');

    const firstProject = currentWorld.travelProjects?.[0];
    if (firstProject && firstProject.generationStatus !== 'ready') {
      setPreparingMessage('正在生成旅行目的地详情...');
      const updatedProject = await selectProject(firstProject.id);
      if (!updatedProject) {
        setPreparingMessage('详情生成失败，请重试');
        setTimeout(() => setViewState('detail'), 2000);
        return;
      }
    }

    const projectId = firstProject?.id || currentWorld.travelProjects?.[0]?.id;
    if (!projectId) {
      setPreparingMessage('没有可用的旅游项目');
      setTimeout(() => setViewState('detail'), 2000);
      return;
    }

    const session = await createSession(projectId, playerName);
    if (session) {
      navigate(`/world-game?session=${session.id}`);
    } else {
      setViewState('detail');
    }
  };

  const handleBack = () => {
    navigate('/worlds');
  };

  // Loading state
  if (isLoading && !currentWorld) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.15),transparent)] pointer-events-none" />
        <div className="text-center relative z-10">
          <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-6" />
          <p className="text-amber-100/70 text-lg tracking-wider">探索世界中...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!currentWorld) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-8">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.15),transparent)] pointer-events-none" />
        <div className="text-center relative z-10 space-y-6">
          <div className="text-3xl font-bold text-amber-100">世界已消失在迷雾中...</div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button
            className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-full font-medium cursor-pointer transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:-translate-y-0.5"
            onClick={handleBack}
          >
            ← 返回世界列表
          </button>
        </div>
      </div>
    );
  }

  // Preparing state
  if (viewState === 'preparing') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-8">
        <div className="fixed inset-0">
          {currentWorld.imageUrl && (
            <img
              src={currentWorld.imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent" />
        </div>
        <div className="text-center relative z-10">
          <div className="w-20 h-20 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-8" />
          <h2 className="text-3xl font-bold mb-4 text-amber-100">{preparingMessage}</h2>
          <div className="mt-8 p-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-amber-500/20 max-w-md mx-auto">
            <h3 className="text-amber-400 font-semibold text-xl mb-3">{currentWorld.name}</h3>
            <p className="text-white/60 text-sm leading-relaxed">{currentWorld.description}</p>
          </div>
        </div>
      </div>
    );
  }

  // Collect all gallery images
  const allGalleryImages = [
    ...(currentWorld.overviewImages || []),
    ...(currentWorld.cultureImages || []),
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ============================================
          IMMERSIVE HERO SECTION
          ============================================ */}
      <section ref={heroRef} className="relative h-screen overflow-hidden">
        {/* Background Image with Parallax */}
        <div 
          className="absolute inset-0 scale-110"
          style={{ transform: `translateY(${scrollY * 0.3}px) scale(1.1)` }}
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
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-amber-400/40 rounded-full animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Top Navigation Bar */}
        <nav className="absolute top-0 left-0 right-0 z-50 p-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <button
              className="group flex items-center gap-2 bg-black/30 backdrop-blur-md border border-white/10 text-white px-5 py-2.5 rounded-full transition-all hover:bg-black/50 hover:border-amber-500/30"
              onClick={handleBack}
            >
              <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
              <span className="text-sm">返回世界列表</span>
            </button>
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
              <div className="flex flex-wrap justify-center gap-2 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                {currentWorld.tags.slice(0, 4).map((tag, idx) => (
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
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <span className="bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_4px_30px_rgba(245,158,11,0.3)]">
                {currentWorld.name}
              </span>
            </h1>

            {/* Subtitle */}
            {currentWorld.subtitle && (
              <p className="text-xl md:text-2xl text-amber-100/80 font-light tracking-wide mb-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                {currentWorld.subtitle}
              </p>
            )}

            {/* Description */}
            <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              {currentWorld.description}
            </p>

            {/* CTA Button */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <button
                className="group relative bg-gradient-to-r from-amber-500 to-orange-500 text-white px-10 py-4 rounded-full text-lg font-semibold transition-all hover:shadow-[0_0_50px_rgba(245,158,11,0.5)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                onClick={handleStartTravel}
                disabled={isGenerating}
              >
                <span className="relative z-10 flex items-center gap-3">
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      准备中...
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">🚀</span>
                      开始探索
                    </>
                  )}
                </span>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
              </button>
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
                  <p className="text-amber-400/80 text-sm font-medium tracking-[0.25em] uppercase mb-4">
                    世界概况
                  </p>
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                    这是一个怎样的
                    <span className="text-amber-400">世界</span>？
                  </h2>
                  <p className="text-white/60 text-lg leading-relaxed">
                    {currentWorld.detailedDescription || currentWorld.description}
                  </p>
                </div>

                {/* Feature List */}
                <div className="grid grid-cols-2 gap-4">
                  {currentWorld.geography && (
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                      <div className="text-amber-400 text-2xl mb-2">🏔️</div>
                      <div className="text-white/40 text-xs uppercase tracking-wide mb-1">地理</div>
                      <div className="text-white/80 text-sm line-clamp-2">{currentWorld.geography}</div>
                    </div>
                  )}
                  {currentWorld.climate && (
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                      <div className="text-cyan-400 text-2xl mb-2">🌤️</div>
                      <div className="text-white/40 text-xs uppercase tracking-wide mb-1">气候</div>
                      <div className="text-white/80 text-sm line-clamp-2">{currentWorld.climate}</div>
                    </div>
                  )}
                  {currentWorld.culture && (
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                      <div className="text-purple-400 text-2xl mb-2">🎭</div>
                      <div className="text-white/40 text-xs uppercase tracking-wide mb-1">文化</div>
                      <div className="text-white/80 text-sm line-clamp-2">{currentWorld.culture}</div>
                    </div>
                  )}
                  {currentWorld.cuisine && (
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                      <div className="text-orange-400 text-2xl mb-2">🍜</div>
                      <div className="text-white/40 text-xs uppercase tracking-wide mb-1">美食</div>
                      <div className="text-white/80 text-sm line-clamp-2">{currentWorld.cuisine}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Stack Image Gallery */}
              <div className="relative">
                <div className="relative h-[500px] flex items-center justify-center">
                  {/* Decorative Cards (Background) */}
                  {allGalleryImages.length > 2 && (
                    <div 
                      className="absolute w-72 h-96 rounded-2xl overflow-hidden border border-white/10 shadow-2xl transform rotate-6 translate-x-12 -translate-y-4 opacity-60"
                    >
                      <img 
                        src={allGalleryImages[2]} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40" />
                    </div>
                  )}
                  {allGalleryImages.length > 1 && (
                    <div 
                      className="absolute w-72 h-96 rounded-2xl overflow-hidden border border-white/10 shadow-2xl transform -rotate-3 translate-x-6 translate-y-2 opacity-80"
                    >
                      <img 
                        src={allGalleryImages[1]} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20" />
                    </div>
                  )}
                  {/* Main Card */}
                  <div 
                    className="relative w-80 h-[420px] rounded-2xl overflow-hidden border border-amber-500/20 shadow-[0_30px_60px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-500 cursor-pointer"
                  >
                    <img 
                      src={allGalleryImages[0] || currentWorld.imageUrl} 
                      alt={currentWorld.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="text-amber-400 text-xs font-medium tracking-wider uppercase mb-2">
                        {currentWorld.era || '神秘纪元'}
                      </div>
                      <div className="text-white font-bold text-lg">{currentWorld.name}</div>
                    </div>
                  </div>
                </div>
              </div>
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
              <div className="text-center mb-16">
                <p className="text-amber-400/80 text-sm font-medium tracking-[0.25em] uppercase mb-4">
                  画廊
                </p>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  世界
                  <span className="text-amber-400">掠影</span>
                </h2>
                <p className="text-white/50 text-lg max-w-2xl mx-auto">
                  探索这个世界的地貌风光与人文风情
                </p>
              </div>

              {/* Masonry Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Large Featured Image */}
                {allGalleryImages[0] && (
                  <div className="col-span-2 row-span-2 group">
                    <div className="relative h-full min-h-[400px] rounded-2xl overflow-hidden border border-white/10 transition-all duration-500 hover:border-amber-500/30 hover:shadow-[0_20px_60px_rgba(245,158,11,0.15)]">
                      <img 
                        src={allGalleryImages[0]} 
                        alt="Gallery 1" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                        <span className="px-3 py-1.5 bg-amber-500/80 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                          🌍 地貌风光
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Smaller Images */}
                {allGalleryImages.slice(1, 5).map((img, idx) => (
                  <div key={idx} className="group">
                    <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 transition-all duration-500 hover:border-amber-500/30 hover:shadow-[0_20px_60px_rgba(245,158,11,0.15)]">
                      <img 
                        src={img} 
                        alt={`Gallery ${idx + 2}`} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
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
                        src={currentWorld.travelVehicle.image}
                        alt={currentWorld.travelVehicle.name}
                        className="absolute inset-0 w-full h-full object-cover lg:object-contain p-8"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1a1a2e] lg:bg-gradient-to-l" />
                    </div>
                  )}

                  {/* Vehicle Info */}
                  <div className="relative p-8 lg:p-12 flex flex-col justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-full w-fit mb-6">
                      <span className="text-amber-400">✨</span>
                      <span className="text-amber-300 text-sm font-medium">旅行器</span>
                    </div>

                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                      {currentWorld.travelVehicle.name}
                    </h3>

                    <p className="text-white/60 text-lg leading-relaxed mb-8">
                      {currentWorld.travelVehicle.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/[0.04] rounded-xl p-4 border border-white/5">
                        <div className="text-white/40 text-xs uppercase tracking-wide mb-1">类型</div>
                        <div className="text-white font-medium">{currentWorld.travelVehicle.type}</div>
                      </div>
                      <div className="bg-white/[0.04] rounded-xl p-4 border border-white/5">
                        <div className="text-white/40 text-xs uppercase tracking-wide mb-1">速度</div>
                        <div className="text-white font-medium">{currentWorld.travelVehicle.speed || '神秘速度'}</div>
                      </div>
                      <div className="bg-white/[0.04] rounded-xl p-4 border border-white/5">
                        <div className="text-white/40 text-xs uppercase tracking-wide mb-1">载客量</div>
                        <div className="text-white font-medium">{currentWorld.travelVehicle.capacity} 人</div>
                      </div>
                      <div className="bg-white/[0.04] rounded-xl p-4 border border-white/5">
                        <div className="text-white/40 text-xs uppercase tracking-wide mb-1">舒适度</div>
                        <div className="text-amber-400 font-medium">
                          {'★'.repeat(currentWorld.travelVehicle.comfortLevel)}
                          {'☆'.repeat(5 - currentWorld.travelVehicle.comfortLevel)}
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
              <div>
                <p className="text-cyan-400/80 text-sm font-medium tracking-[0.25em] uppercase mb-4">
                  探索行程
                </p>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  精彩
                  <span className="text-cyan-400">旅程</span>
                </h2>
                <p className="text-white/50 text-lg">
                  本次旅行包含 {projects.length} 个精彩项目
                </p>
              </div>

              {/* Navigation Hint */}
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <span>← 滑动浏览 →</span>
              </div>
            </div>

            {/* Horizontal Scroll Cards */}
            <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-6 px-6">
              {projects.map((project, index) => (
                <div
                  key={project.id}
                  className="group relative flex-shrink-0 w-[320px] md:w-[380px] snap-center"
                >
                  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 transition-all duration-500 hover:border-cyan-500/30 hover:shadow-[0_30px_60px_rgba(6,182,212,0.15)] hover:-translate-y-2">
                    {/* Project Image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {project.coverImage ? (
                        <img
                          src={project.coverImage}
                          alt={project.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2a2a4a] to-[#1a1a3a]">
                          <span className="text-6xl">🗺️</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/20 to-transparent" />

                      {/* Index Badge */}
                      <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-cyan-500 text-white font-bold flex items-center justify-center shadow-lg shadow-cyan-500/30">
                        {index + 1}
                      </div>

                      {/* Difficulty Badge */}
                      <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs text-white/80">
                        难度 {'★'.repeat(project.difficulty)}
                      </div>
                    </div>

                    {/* Project Info */}
                    <div className="relative p-6">
                      <h4 className="text-white font-bold text-xl mb-2 line-clamp-1 group-hover:text-cyan-400 transition-colors">
                        {project.name}
                      </h4>
                      <p className="text-white/50 text-sm leading-relaxed line-clamp-2 mb-4">
                        {project.description}
                      </p>

                      {/* Tags */}
                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {project.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs text-white/60"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
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
              <span className="text-amber-400">准备</span>
              <span className="text-white">启程</span>
            </h2>

            <p className="text-white/60 text-lg md:text-xl mb-10 leading-relaxed">
              搭乘 <span className="text-amber-400 font-medium">{currentWorld.travelVehicle?.name || '神秘旅行器'}</span>，
              开启您的异世界探索之旅
            </p>

            {isAuthenticated && user ? (
              <div className="space-y-8">
                {/* User Card */}
                <div className="inline-flex items-center gap-4 bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-full px-6 py-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-amber-500/30">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="text-white font-medium">{user.displayName}</div>
                    <div className="text-xs text-amber-400/80">{USER_ROLE_NAMES[user.role]}</div>
                  </div>
                </div>

                {/* Start Button */}
                <div>
                  <button
                    className="group relative bg-gradient-to-r from-amber-500 to-orange-500 text-white px-12 py-5 rounded-full text-xl font-bold transition-all hover:shadow-[0_0_60px_rgba(245,158,11,0.5)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                    onClick={handleStartTravel}
                    disabled={isGenerating}
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      {isGenerating ? (
                        <>
                          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                          准备中...
                        </>
                      ) : (
                        <>
                          <span className="text-2xl">🚀</span>
                          立即启程
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity pointer-events-none" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-white/40">登录后即可开始旅行</p>
                <button
                  className="group relative bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-10 py-4 rounded-full text-lg font-semibold transition-all hover:shadow-[0_0_50px_rgba(6,182,212,0.4)] hover:-translate-y-1"
                  onClick={() => openAuthModal('login')}
                >
                  <span className="relative z-10">登录 / 注册</span>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-100 blur-xl transition-opacity pointer-events-none" />
                </button>
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

      <AuthModal isOpen={showAuthModal} onClose={handleAuthModalClose} defaultTab={authModalTab} />
    </div>
  );
}
