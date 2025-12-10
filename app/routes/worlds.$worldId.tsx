import { useEffect, useState } from 'react';
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

  if (isLoading && !currentWorld) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.15),transparent)] pointer-events-none" />
        <div className="text-center relative z-10">
          <div className="w-12 h-12 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">正在获取世界详情...</p>
        </div>
      </div>
    );
  }

  if (!currentWorld) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.15),transparent)] pointer-events-none" />
        <div className="text-center relative z-10 space-y-4">
          <div className="text-2xl font-semibold">未找到世界</div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button
            className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg cursor-pointer transition-all hover:bg-white/15 hover:border-white/30"
            onClick={handleBack}
          >
            返回世界列表
          </button>
        </div>
      </div>
    );
  }

  if (viewState === 'preparing') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.15),transparent)] pointer-events-none" />
        <div className="text-center relative z-10">
          <div className="w-16 h-16 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">{preparingMessage}</h2>
          {currentWorld && (
            <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-indigo-400 font-semibold mb-2">{currentWorld.name}</h3>
              <p className="text-white/70 text-sm">{currentWorld.description}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.15),transparent)] pointer-events-none" />
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg cursor-pointer transition-all hover:bg-white/15 hover:border-white/30"
            onClick={handleBack}
          >
            ← 返回世界列表
          </button>
          {error && (
            <div
              className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg cursor-pointer"
              onClick={clearError}
            >
              {error}（点击关闭）
            </div>
          )}
        </div>

        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent mb-2">
              {currentWorld.name}
            </h1>
            {currentWorld.subtitle && (
              <p className="text-white/80 text-lg mb-2">{currentWorld.subtitle}</p>
            )}
          </div>
          {currentWorld.imageUrl && (
            <img
              src={currentWorld.imageUrl}
              alt={currentWorld.name}
              className="w-full max-h-[300px] object-cover rounded-2xl border border-white/10"
            />
          )}
        </div>

        <div className="max-w-5xl mx-auto space-y-8">
          <section className="relative rounded-[2rem] overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] border border-white/[0.08] shadow-[0_40px_100px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(99,102,241,0.12),transparent_60%)] pointer-events-none" />
            <div className="relative z-10 px-8 pt-10 pb-8">
              <p className="text-[11px] font-medium tracking-[0.25em] uppercase text-indigo-400/80 mb-2">世界概况</p>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">地貌 · 气候 · 地标</h3>
            </div>
            <div className="relative z-10 flex gap-5 px-8 pb-10 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
              {(currentWorld.overviewImages && currentWorld.overviewImages.length > 0
                ? currentWorld.overviewImages
                : currentWorld.imageUrl
                  ? [currentWorld.imageUrl]
                  : []).map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="group relative flex-shrink-0 w-[75vw] max-w-[480px] aspect-[16/10] rounded-2xl overflow-hidden snap-center ring-1 ring-white/10 transition-transform duration-300 hover:scale-[1.02]"
                >
                  <img src={url} alt={`${currentWorld.name} 概况 ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>
              ))}
              {(!currentWorld.overviewImages || currentWorld.overviewImages.length === 0) && !currentWorld.imageUrl && (
                <div className="flex-shrink-0 w-[75vw] max-w-[480px] aspect-[16/10] flex items-center justify-center rounded-2xl border border-dashed border-white/10 text-white/40 text-sm">
                  暂无概况图片
                </div>
              )}
            </div>
          </section>

          <section className="relative rounded-[2rem] overflow-hidden bg-[linear-gradient(135deg,rgba(139,92,246,0.06),rgba(99,102,241,0.04),rgba(255,255,255,0.01))] border border-white/[0.08] shadow-[0_40px_100px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_-10%,rgba(168,85,247,0.15),transparent_55%)] pointer-events-none" />
            <div className="relative z-10 px-8 pt-10 pb-8">
              <p className="text-[11px] font-medium tracking-[0.25em] uppercase text-purple-400/80 mb-2">特色文化</p>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">人文 · 美食 · 交流</h3>
            </div>
            <div className="relative z-10 flex gap-5 px-8 pb-10 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
              {(currentWorld.cultureImages && currentWorld.cultureImages.length > 0
                ? currentWorld.cultureImages
                : currentWorld.imageUrl
                  ? [currentWorld.imageUrl]
                  : []).map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="group relative flex-shrink-0 w-[75vw] max-w-[480px] aspect-[16/10] rounded-2xl overflow-hidden snap-center ring-1 ring-white/10 transition-transform duration-300 hover:scale-[1.02]"
                >
                  <img src={url} alt={`${currentWorld.name} 文化 ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>
              ))}
              {(!currentWorld.cultureImages || currentWorld.cultureImages.length === 0) && !currentWorld.imageUrl && (
                <div className="flex-shrink-0 w-[75vw] max-w-[480px] aspect-[16/10] flex items-center justify-center rounded-2xl border border-dashed border-white/10 text-white/40 text-sm">
                  暂无文化图片
                </div>
              )}
            </div>
          </section>

          {currentWorld.travelVehicle && (
            <section className="relative rounded-[2rem] overflow-hidden bg-[linear-gradient(160deg,rgba(99,102,241,0.08),rgba(139,92,246,0.06),rgba(0,0,0,0))] border border-indigo-500/15 shadow-[0_40px_100px_rgba(99,102,241,0.12)]">
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 md:p-10">
                <div className="flex flex-col justify-center space-y-4">
                  <p className="text-[11px] font-medium tracking-[0.25em] uppercase text-indigo-400/80">旅行器</p>
                  <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight">{currentWorld.travelVehicle.name}</h3>
                  <p className="text-white/70 text-base md:text-lg leading-relaxed">{currentWorld.travelVehicle.description}</p>
                  <p className="text-white/50 text-sm">类型：{currentWorld.travelVehicle.type}</p>
                </div>
                {currentWorld.travelVehicle.image && (
                  <div className="flex items-center justify-center">
                    <img
                      src={currentWorld.travelVehicle.image}
                      alt={currentWorld.travelVehicle.name}
                      className="w-full max-h-80 object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="space-y-6">
            <div className="px-1">
              <p className="text-[11px] font-medium tracking-[0.25em] uppercase text-cyan-400/80 mb-2">旅游项目</p>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">探索行程</h3>
              <p className="text-white/60 text-sm md:text-base">本次旅行包含 {projects.length} 个精彩项目</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((project, index) => (
                <div
                  key={project.id}
                  className="group relative rounded-2xl overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] border border-white/[0.08] shadow-lg transition-all duration-300 hover:shadow-[0_30px_60px_rgba(0,0,0,0.4)] hover:-translate-y-1"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {project.coverImage ? (
                      <img
                        src={project.coverImage}
                        alt={project.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2a2a4a] to-[#1a1a3a] text-5xl">
                        🗺️
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <span className="absolute top-3 left-3 w-7 h-7 rounded-full bg-indigo-500/80 text-white text-xs font-bold flex items-center justify-center shadow-md">
                      {index + 1}
                    </span>
                  </div>
                  <div className="p-5 space-y-2">
                    <h4 className="text-white font-semibold text-base line-clamp-1">{project.name}</h4>
                    <p className="text-white/55 text-xs leading-relaxed line-clamp-2">{project.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">准备启程</h3>
            <p className="text-white/60 mb-6">
              搭乘 {currentWorld.travelVehicle?.name || '神秘旅行器'}，开启您的异世界之旅
            </p>

            {isAuthenticated && user ? (
              <>
                <div className="mb-6 flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="text-white font-medium">{user.displayName}</div>
                    <div className="text-xs text-slate-400">{USER_ROLE_NAMES[user.role]}</div>
                  </div>
                </div>
                <button
                  className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  onClick={handleStartTravel}
                  disabled={isGenerating}
                >
                  {isGenerating ? '准备中...' : '🚀 开始旅程'}
                </button>
              </>
            ) : (
              <div>
                <p className="text-white/50 mb-4">登录后即可开始旅行</p>
                <button
                  className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white border-none px-6 py-3 rounded-full font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(6,182,212,0.3)]"
                  onClick={() => openAuthModal('login')}
                >
                  登录 / 注册
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
