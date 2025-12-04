import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
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
