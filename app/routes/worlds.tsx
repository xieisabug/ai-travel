import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorlds } from '~/hooks/useWorlds';
import { useAuthContext, canGenerateWorld, getRemainingWorldGenerations } from '~/hooks/useAuth';
import { AuthModal, UserInfo } from '~/components/AuthModal';
import { CurrencyDisplay } from '~/components/CurrencyDisplay';
import { DailyRewardToast } from '~/components/DailyRewardToast';
import { USER_ROLE_NAMES, type LoginResponse } from '~/types/user';

type ViewState = 'worlds' | 'world_detail' | 'preparing' | 'generating';

// 生成阶段信息
const generationSteps = [
  { id: 1, label: '创建世界基础', icon: '🌍' },
  { id: 2, label: '设计旅行器', icon: '🚀' },
  { id: 3, label: '生成旅游项目', icon: '🗺️' },
  { id: 4, label: '创建景点详情', icon: '🏛️' },
  { id: 5, label: '生成 NPC 角色', icon: '👥' },
  { id: 6, label: '绘制图片素材', icon: '🎨' },
];

export default function WorldsPage() {
  const navigate = useNavigate();
  const {
    worlds,
    currentWorld,
    projects,
    isLoading,
    isGenerating,
    error,
    generateWorld,
    selectWorld,
    selectProject,
    createSession,
    clearError,
  } = useWorlds();

  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuthContext();

  const [viewState, setViewState] = useState<ViewState>('worlds');
  const [preparingMessage, setPreparingMessage] = useState('');
  const [currentGenStep, setCurrentGenStep] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  // 每日奖励通知状态
  const [dailyReward, setDailyReward] = useState<{ show: boolean; amount: number }>({
    show: false,
    amount: 0,
  });

  // 打开登录弹窗
  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setShowAuthModal(true);
  };

  // 关闭登录弹窗并刷新用户信息，处理每日奖励
  const handleAuthModalClose = (loginResponse?: LoginResponse) => {
    setShowAuthModal(false);
    refreshUser();

    // 如果登录响应包含每日奖励信息，显示通知
    if (loginResponse?.dailyRewardClaimed && loginResponse?.dailyRewardAmount) {
      setDailyReward({
        show: true,
        amount: loginResponse.dailyRewardAmount,
      });
    }
  };

  // 生成新世界
  const handleGenerateWorld = async () => {
    // 检查登录状态
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    // 检查权限
    if (!canGenerateWorld(user)) {
      alert('您没有生成世界的权限，请升级到 Pro 会员');
      return;
    }

    // 检查每日限额
    const remaining = getRemainingWorldGenerations(user);
    if (remaining <= 0) {
      alert('您今日的世界生成次数已用完，请明天再试或升级会员');
      return;
    }

    setViewState('generating');
    setCurrentGenStep(1);

    // 模拟进度更新（实际生成时间较长，提供视觉反馈）
    const progressInterval = setInterval(() => {
      setCurrentGenStep(prev => {
        if (prev < 6) return prev + 1;
        return prev;
      });
    }, 3000);

    const world = await generateWorld();

    clearInterval(progressInterval);

    if (world) {
      setCurrentGenStep(6);
      // 刷新用户信息以更新生成次数
      refreshUser();
      setTimeout(() => {
        setViewState('world_detail');
      }, 1000);
    } else {
      setViewState('worlds');
    }
  };

  // 选择已有世界
  const handleSelectWorld = async (worldId: string) => {
    const world = await selectWorld(worldId);
    if (world) {
      setViewState('world_detail');
    }
  };

  // 开始旅行（直接开始，不需要选择项目）
  const handleStartTravel = async () => {
    if (!currentWorld) return;

    // 检查登录状态
    if (!isAuthenticated || !user) {
      openAuthModal('login');
      return;
    }

    // 使用登录用户的显示名称
    const playerName = user.displayName;

    setPreparingMessage('正在准备您的旅程...');
    setViewState('preparing');

    // 如果有项目且第一个项目未就绪，先生成详情
    const firstProject = currentWorld.travelProjects?.[0];
    if (firstProject && firstProject.generationStatus !== 'ready') {
      setPreparingMessage('正在生成旅行目的地详情...');
      const updatedProject = await selectProject(firstProject.id);
      if (!updatedProject) {
        setPreparingMessage('详情生成失败，请重试');
        setTimeout(() => setViewState('world_detail'), 2000);
        return;
      }
    }

    // 创建会话
    const projectId = firstProject?.id || currentWorld.travelProjects?.[0]?.id;
    if (!projectId) {
      setPreparingMessage('没有可用的旅游项目');
      setTimeout(() => setViewState('world_detail'), 2000);
      return;
    }

    const session = await createSession(projectId, playerName);
    if (session) {
      // 导航到世界游戏页面
      navigate(`/world-game?session=${session.id}`);
    } else {
      setViewState('world_detail');
    }
  };

  // 返回世界列表
  const handleBackToWorlds = () => {
    setViewState('worlds');
  };

  // 渲染加载状态
  if (isLoading && worlds.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.15),transparent)] pointer-events-none" />
        <div className="text-center relative z-10">
          <div className="w-12 h-12 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">正在探索异世界...</p>
        </div>
      </div>
    );
  }

  // 渲染世界生成中状态
  if (viewState === 'generating') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.15),transparent)] pointer-events-none" />
        <div className="max-w-[600px] w-full p-8 text-center relative z-10">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              ✨ 正在创造新世界
            </h1>
            <p className="text-white/70 text-lg">AI 正在为您构建一个独一无二的异世界...</p>
          </div>

          <div className="bg-white/5 rounded-2xl p-8 mb-8 border border-white/10">
            <div className="flex flex-col gap-6">
              {generationSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 relative transition-all duration-300 ${currentGenStep > index || currentGenStep === index + 1 ? 'opacity-100' : 'opacity-40'}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-300 ${currentGenStep > index ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : currentGenStep === index + 1 ? 'bg-indigo-500/20 border-2 border-indigo-500 animate-pulse' : 'bg-white/10'}`}>
                    {currentGenStep > index ? '✓' : step.icon}
                  </div>
                  <div className={`text-base font-medium ${currentGenStep > index ? 'text-indigo-400' : currentGenStep === index + 1 ? 'text-white' : 'text-white/50'}`}>
                    {step.label}
                  </div>
                  {index < generationSteps.length - 1 && (
                    <div className={`absolute left-[23px] top-12 w-0.5 h-8 transition-all duration-300 ${currentGenStep > index + 1 ? 'bg-indigo-500' : 'bg-white/10'}`} />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 mt-8 pt-6 border-t border-white/10 text-indigo-400 text-lg">
              {currentGenStep > 0 && currentGenStep <= 6 && (
                <>
                  <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
                  <span>{generationSteps[currentGenStep - 1]?.label}...</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6">
            <p className="text-white/70 text-sm mb-1">💡 小提示：生成一个完整的世界大约需要 1-2 分钟</p>
            <p className="text-white/70 text-sm">包含世界设定、旅行器、旅游项目、景点、NPC 和图片</p>
          </div>
        </div>
      </div>
    );
  }

  // 渲染准备中状态
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

  // 渲染世界详情页（替代原来的项目选择页）
  if (viewState === 'world_detail' && currentWorld) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.15),transparent)] pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="mb-8">
            <button
              className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg cursor-pointer transition-all hover:bg-white/15 hover:border-white/30 mb-6"
              onClick={handleBackToWorlds}
            >
              ← 返回世界列表
            </button>
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
            {error && (
              <div
                className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-lg cursor-pointer text-center"
                onClick={clearError}
              >
                {error}（点击关闭）
              </div>
            )}

            {/* 世界概况 */}
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

            {/* 特色文化 */}
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

            {/* 旅行器 */}
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

            {/* 旅游项目 */}
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

            {/* 开始旅行 */}
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
      </div>
    );
  }

  // 渲染世界列表页
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.15),transparent)] pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      {/* 认证弹窗 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        defaultTab={authModalTab}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* 顶部导航栏 */}
        <div className="flex justify-between items-center mb-8">
          <button
            className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg cursor-pointer transition-all hover:bg-white/15 hover:border-white/30"
            onClick={() => navigate('/')}
          >
            ← 返回主页
          </button>

          {/* 用户信息或登录按钮 */}
          <div className="flex items-center gap-4">
            {authLoading ? (
              <div className="w-8 h-8 border-2 border-white/20 border-t-cyan-500 rounded-full animate-spin" />
            ) : isAuthenticated && user ? (
              <>
                <CurrencyDisplay />
                <UserInfo />
              </>
            ) : (
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                  onClick={() => openAuthModal('login')}
                >
                  登录
                </button>
                <button
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all"
                  onClick={() => openAuthModal('register')}
                >
                  注册
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 每日奖励通知 */}
        {dailyReward.show && (
          <DailyRewardToast
            amount={dailyReward.amount}
            onClose={() => setDailyReward({ show: false, amount: 0 })}
          />
        )}

        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent mb-2">
            🌍 异世界探索
          </h1>
          <p className="text-white/60">发现由 AI 创造的奇幻世界，开启独一无二的旅程</p>
        </div>

        {error && (
          <div
            className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-lg mb-6 cursor-pointer text-center max-w-xl mx-auto"
            onClick={clearError}
          >
            {error}（点击关闭）
          </div>
        )}

        <div className="text-center mb-8">
          <button
            className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all inline-flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            onClick={handleGenerateWorld}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                正在创造新世界...
              </>
            ) : (
              '✨ 创造新世界'
            )}
          </button>
        </div>

        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-indigo-400 mb-4">已发现的世界</h2>

          {worlds.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-white/50 mb-2">还没有发现任何世界</p>
              <p className="text-white/50">点击上方按钮创造您的第一个异世界吧！</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {worlds.map(world => (
                <div
                  key={world.id}
                  className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                  onClick={() => handleSelectWorld(world.id)}
                >
                  {world.imageUrl ? (
                    <img
                      src={world.imageUrl}
                      alt={world.name}
                      className="w-full h-44 object-cover"
                    />
                  ) : (
                    <div className="w-full h-44 flex items-center justify-center bg-gradient-to-br from-[#2a2a4a] to-[#1a1a3a] text-6xl">
                      🌌
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="text-indigo-400 font-semibold mb-2">{world.name}</h3>
                    <p className="text-white/60 text-sm mb-4 line-clamp-3 leading-relaxed">{world.description}</p>
                    <div className="flex justify-between items-center text-xs text-white/40">
                      <span>{world.travelProjects?.length || 0} 个旅行项目</span>
                      {world.travelVehicle && (
                        <span className="text-indigo-400">🚀 {world.travelVehicle.name}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
