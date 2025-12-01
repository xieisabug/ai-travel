import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDefaultStorage } from '~/lib/storage';
import type { GameSave } from '~/types/game';

export default function Home() {
  const navigate = useNavigate();
  const [saves, setSaves] = useState<GameSave[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [showNewGame, setShowNewGame] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // 客户端挂载后才生成星星，避免 hydration 不匹配
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 使用 useMemo 缓存星星位置，只在客户端生成一次
  const stars = useMemo(() => {
    if (!isMounted) return [];
    return [...Array(50)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      opacity: Math.random() * 0.7 + 0.3,
    }));
  }, [isMounted]);

  // 加载存档列表
  useEffect(() => {
    const loadSaves = async () => {
      try {
        const storage = getDefaultStorage();
        const allSaves = await storage.getAllSaves();
        setSaves(allSaves);
      } catch (error) {
        console.error('Failed to load saves:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSaves();
  }, []);

  // 开始新游戏
  const handleNewGame = async () => {
    if (!playerName.trim()) return;

    // 跳转到游戏页面，带上玩家名称参数
    navigate(`/game?new=true&name=${encodeURIComponent(playerName.trim())}`);
  };

  // 继续游戏
  const handleContinue = (saveId: string) => {
    navigate(`/game?save=${saveId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 flex flex-col items-center justify-center p-4">
      {/* 星空背景效果 - 只在客户端渲染 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={{
              left: star.left,
              top: star.top,
              animationDelay: star.delay,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      {/* 主内容 */}
      <div className="relative z-10 text-center">
        {/* 标题 */}
        <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 mb-4">
          AI 虚拟旅行
        </h1>
        <p className="text-xl md:text-2xl text-purple-300/80 mb-2">
          ✨ 星月岛之旅 ✨
        </p>
        <p className="text-gray-400 mb-12 max-w-md mx-auto">
          踏上一场由AI生成的梦幻冒险，从购买机票到归家，体验完整的虚拟旅程
        </p>

        {/* 按钮区域 */}
        <div className="space-y-4 w-80 mx-auto">
          {/* 探索 AI 世界入口 */}
          <button
            onClick={() => navigate('/worlds')}
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-lg font-semibold rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-105"
          >
            🌍 探索 AI 异世界
          </button>

          {/* 新游戏区域（经典模式） */}
          {!showNewGame ? (
            <button
              onClick={() => setShowNewGame(true)}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-lg font-semibold rounded-xl shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105"
            >
              🚀 经典模式：星月岛之旅
            </button>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-4">你叫什么名字？</h3>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="输入你的名字..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 mb-4"
                maxLength={20}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleNewGame()}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewGame(false)}
                  className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleNewGame}
                  disabled={!playerName.trim()}
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  出发！
                </button>
              </div>
            </div>
          )}

          {/* 继续游戏 */}
          {!isLoading && saves.length > 0 && !showNewGame && (
            <div className="space-y-3">
              <div className="text-gray-400 text-sm">或继续之前的旅程</div>
              {saves.slice(0, 3).map((save) => (
                <button
                  key={save.id}
                  onClick={() => handleContinue(save.id)}
                  className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all duration-200 text-left flex items-center gap-3"
                >
                  <span className="text-2xl">📍</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{save.player.name} 的旅程</div>
                    <div className="text-sm text-gray-400">
                      {getPhaseLabel(save.currentPhase)} · {formatDate(save.updatedAt)}
                    </div>
                  </div>
                  <span className="text-gray-400">▶</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div className="mt-16 text-gray-500 text-sm">
          <p>🎮 类似Galgame的互动体验</p>
          <p className="mt-1">🤖 AI生成虚拟景点和对话</p>
        </div>
      </div>
    </div>
  );
}

function getPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    planning: '规划中',
    booking: '购票中',
    departure: '出发',
    traveling: '旅途中',
    destination: '目的地',
    return: '返程',
    home: '归家',
  };
  return labels[phase] || phase;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  return date.toLocaleDateString('zh-CN');
}
