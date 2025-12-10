import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthModal } from '~/components/auth-modal';
import { DailyRewardToast } from '~/components/daily-reward-toast';
import { useWorlds } from '~/hooks/use-worlds';
import { useAuthContext, canGenerateWorld, getRemainingWorldGenerations } from '~/hooks/use-auth';
import type { LoginResponse } from '~/types/user';

const generationSteps = [
  { id: 1, label: '创建世界基础', icon: '🌍' },
  { id: 2, label: '设计旅行器', icon: '🚀' },
  { id: 3, label: '生成旅游项目', icon: '🗺️' },
  { id: 4, label: '创建景点详情', icon: '🏛️' },
  { id: 5, label: '生成 NPC 角色', icon: '👥' },
  { id: 6, label: '绘制图片素材', icon: '🎨' },
];

export default function WorldsGeneratePage() {
  const navigate = useNavigate();
  const { generateWorld, currentWorld, isGenerating, error, clearError } = useWorlds();
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuthContext();

  const [currentGenStep, setCurrentGenStep] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [dailyReward, setDailyReward] = useState<{ show: boolean; amount: number }>({
    show: false,
    amount: 0,
  });

  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);
  const navigatedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

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

  const startGeneration = async () => {
    if (!user) return;

    if (!canGenerateWorld(user)) {
      alert('您没有生成世界的权限，请升级到 Pro 会员');
      navigate('/worlds');
      return;
    }

    const remaining = getRemainingWorldGenerations(user);
    if (remaining <= 0) {
      alert('您今日的世界生成次数已用完，请明天再试或升级会员');
      navigate('/worlds');
      return;
    }

    setCurrentGenStep(1);

    progressIntervalRef.current = setInterval(() => {
      setCurrentGenStep(prev => (prev < 6 ? prev + 1 : prev));
    }, 3000);

    const world = await generateWorld();

    if (world && world.id) {
      setCurrentGenStep(6);
      refreshUser();
      navigatedRef.current = true;
      setTimeout(() => navigate(`/worlds/${world.id}`), 800);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      openAuthModal('login');
      return;
    }

    if (startedRef.current) return;
    startedRef.current = true;
    void startGeneration();
  }, [authLoading, isAuthenticated, user]);

  useEffect(() => {
    if (!startedRef.current) return;
    if (isGenerating) return;
    if (!currentWorld || navigatedRef.current) return;

    setCurrentGenStep(6);
    refreshUser();
    navigatedRef.current = true;
    const timer = setTimeout(() => navigate(`/worlds/${currentWorld.id}`), 800);

    return () => clearTimeout(timer);
  }, [currentWorld, isGenerating, navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.15),transparent)] pointer-events-none" />
      <div className="max-w-[640px] w-full p-8 text-center relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <button
            className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg cursor-pointer transition-all hover:bg-white/15 hover:border-white/30"
            onClick={() => navigate('/worlds')}
          >
            ← 返回世界列表
          </button>
          {error && (
            <button
              className="text-red-400 text-sm underline"
              onClick={clearError}
            >
              清除错误
            </button>
          )}
        </div>

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            ✨ 正在创造新世界
          </h1>
          <p className="text-white/70 text-lg">AI 正在为您构建一个独一无二的异世界...</p>
        </div>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/40 text-red-300 rounded-2xl p-6 space-y-4">
            <div className="text-lg font-semibold">生成失败</div>
            <div className="text-white/70 text-sm">{error}</div>
            <div className="flex items-center justify-center gap-3">
              <button
                className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg cursor-pointer transition-all hover:bg-white/15 hover:border-white/30"
                onClick={() => navigate('/worlds')}
              >
                返回世界列表
              </button>
              <button
                className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-4 py-2 rounded-lg font-semibold cursor-pointer transition-all hover:-translate-y-0.5"
                onClick={() => {
                  clearError();
                  startedRef.current = false;
                  navigatedRef.current = false;
                  void startGeneration();
                }}
              >
                重试生成
              </button>
            </div>
          </div>
        ) : (
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
        )}

        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6">
          <p className="text-white/70 text-sm mb-1">💡 小提示：生成一个完整的世界大约需要 1-2 分钟</p>
          <p className="text-white/70 text-sm">包含世界设定、旅行器、旅游项目、景点、NPC 和图片</p>
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
