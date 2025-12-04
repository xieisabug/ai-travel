import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { TravelSession, Spot, SpotNPC, TravelMemory } from '~/types/world';

type GamePhase = 'loading' | 'departing' | 'traveling' | 'exploring' | 'dialog' | 'returning' | 'completed';

interface DialogLine {
  speaker: string;
  text: string;
  emotion?: string;
}

export default function WorldGamePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');

  const [phase, setPhase] = useState<GamePhase>('loading');
  const [session, setSession] = useState<TravelSession | null>(null);
  const [currentSpot, setCurrentSpot] = useState<Spot | null>(null);
  const [currentNPC, setCurrentNPC] = useState<SpotNPC | null>(null);
  const [dialogLines, setDialogLines] = useState<DialogLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 加载会话数据
  const loadSession = useCallback(async () => {
    if (!sessionId) {
      setError('无效的会话ID');
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) throw new Error('加载会话失败');
      const data: TravelSession = await response.json();
      setSession(data);

      // 根据会话状态设置游戏阶段
      switch (data.status) {
        case 'preparing':
        case 'departing':
          setPhase('departing');
          break;
        case 'traveling':
          setPhase('traveling');
          break;
        case 'exploring':
          setPhase('exploring');
          if (data.currentSpotId) {
            await loadSpot(data.projectId, data.currentSpotId);
          }
          break;
        case 'returning':
          setPhase('returning');
          break;
        case 'completed':
          setPhase('completed');
          break;
        default:
          setPhase('departing');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    }
  }, [sessionId]);

  // 加载景点数据
  const loadSpot = async (projectId: string, spotId: string) => {
    // 如果 spotId 为空，不进行请求
    if (!spotId) {
      console.warn('spotId 为空，跳过加载景点');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/spots/${spotId}`);
      if (!response.ok) throw new Error('加载景点失败');
      const spot: Spot = await response.json();
      setCurrentSpot(spot);

      // 生成入场对话
      if (spot.npcs && spot.npcs.length > 0) {
        const npc = spot.npcs[0];
        setCurrentNPC(npc);
        generateEntryDialog(spot, npc);
      }
    } catch (err) {
      console.error('加载景点失败:', err);
    }
  };

  // 开始探索（进入第一个景点）
  const startExploring = async () => {
    if (!session) return;

    try {
      // 调用 next-spot API 来开始探索，设置第一个景点
      const response = await fetch(`/api/sessions/${session.id}/next-spot`, {
        method: 'POST',
      });

      const data = await response.json() as { completed?: boolean; error?: string; spot?: Spot; session?: TravelSession };

      if (!response.ok) {
        throw new Error(data.error || '开始探索失败');
      }

      if (data.spot) {
        setCurrentSpot(data.spot);
        if (data.spot.npcs && data.spot.npcs.length > 0) {
          setCurrentNPC(data.spot.npcs[0]);
          generateEntryDialog(data.spot, data.spot.npcs[0]);
        } else {
          setPhase('exploring');
        }

        // 更新会话状态
        if (data.session) {
          setSession(data.session);
        }
      }
    } catch (err) {
      console.error('开始探索失败:', err);
      setError(err instanceof Error ? err.message : '开始探索失败');
    }
  };

  // 生成入场对话
  const generateEntryDialog = async (spot: Spot, npc: SpotNPC) => {
    // 模拟生成对话（实际项目中应该调用 AI 接口）
    const lines: DialogLine[] = [
      { speaker: npc.name, text: `欢迎来到${spot.name}！我是${npc.name}，${npc.role}。`, emotion: 'happy' },
      { speaker: npc.name, text: spot.description, emotion: 'neutral' },
      { speaker: npc.name, text: `${spot.story}`, emotion: 'thinking' },
      { speaker: npc.name, text: `这里有很多值得探索的地方，${spot.highlights.join('、')}都非常值得一看。`, emotion: 'happy' },
    ];
    setDialogLines(lines);
    setCurrentLineIndex(0);
    setPhase('dialog');
  };

  // 打字机效果
  useEffect(() => {
    if (phase !== 'dialog' || dialogLines.length === 0) return;

    const currentLine = dialogLines[currentLineIndex];
    if (!currentLine) return;

    setDisplayedText('');
    setIsTyping(true);

    let charIndex = 0;
    const text = currentLine.text;

    typewriterRef.current = setInterval(() => {
      if (charIndex < text.length) {
        setDisplayedText(text.substring(0, charIndex + 1));
        charIndex++;
      } else {
        if (typewriterRef.current) {
          clearInterval(typewriterRef.current);
        }
        setIsTyping(false);
      }
    }, 50);

    return () => {
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
      }
    };
  }, [phase, dialogLines, currentLineIndex]);

  // 处理点击继续
  const handleContinue = () => {
    if (isTyping) {
      // 如果正在打字，直接显示完整文本
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
      }
      setDisplayedText(dialogLines[currentLineIndex]?.text || '');
      setIsTyping(false);
    } else if (currentLineIndex < dialogLines.length - 1) {
      // 下一句对话
      setCurrentLineIndex(prev => prev + 1);
    } else {
      // 对话结束，返回探索
      setPhase('exploring');
    }
  };

  // 前往下一个景点
  const handleNextSpot = async () => {
    if (!session) return;

    try {
      const response = await fetch(`/api/sessions/${session.id}/next-spot`, {
        method: 'POST',
      });

      const data = await response.json() as { completed?: boolean; error?: string; spot?: Spot };

      if (!response.ok) {
        if (data.completed) {
          setPhase('returning');
        } else {
          throw new Error(data.error || '前往下一景点失败');
        }
        return;
      }

      if (data.spot) {
        setCurrentSpot(data.spot);
        if (data.spot.npcs && data.spot.npcs.length > 0) {
          setCurrentNPC(data.spot.npcs[0]);
          generateEntryDialog(data.spot, data.spot.npcs[0]);
        }
      }
    } catch (err) {
      console.error('前往下一景点失败:', err);
    }
  };

  // 完成旅程
  const handleCompleteTrip = async () => {
    if (!session) return;

    try {
      await fetch(`/api/sessions/${session.id}/complete`, {
        method: 'POST',
      });
      setPhase('completed');
    } catch (err) {
      console.error('完成旅程失败:', err);
    }
  };

  // 返回首页
  const handleGoHome = () => {
    navigate('/');
  };

  // 初始加载
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // 渲染加载状态
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.15),transparent)] pointer-events-none" />
        <div className="text-center relative z-10">
          <div className="w-12 h-12 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">正在准备您的旅程...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.15),transparent)] pointer-events-none" />
        <div className="text-center relative z-10">
          <h2 className="text-3xl font-bold mb-4 text-red-400">😢 出错了</h2>
          <p className="text-white/70 mb-8">{error}</p>
          <button 
            className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-8 py-4 rounded-full text-base font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)]"
            onClick={handleGoHome}
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // 启程中
  if (phase === 'departing') {
    return (
      <div className="min-h-screen relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-indigo-950/50 to-purple-900/30" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.2),transparent)] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 text-center text-white">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
            🚀 启程
          </h1>
          <p className="text-xl text-white/80 mb-8">正在前往神秘的异世界...</p>
          <div className="my-8">
            <div className="text-5xl animate-bounce">✈️</div>
          </div>
          <button 
            className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)]"
            onClick={() => setPhase('traveling')}
          >
            开始旅程
          </button>
        </div>
      </div>
    );
  }

  // 旅途中
  if (phase === 'traveling') {
    return (
      <div className="min-h-screen relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-950/50 to-black animate-pulse" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.2),transparent)] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 text-center text-white">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
            🌤️ 旅途中
          </h1>
          <p className="text-xl text-white/80 mb-8">穿越时空的缝隙，前往未知的世界...</p>
          <div className="w-[300px] h-2.5 bg-white/20 rounded-full overflow-hidden my-8 shadow-lg">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500 w-1/2" />
          </div>
          <button 
            className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)]"
            onClick={startExploring}
          >
            抵达目的地
          </button>
        </div>
      </div>
    );
  }

  // 探索景点
  if (phase === 'exploring' && currentSpot) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-black">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-gradient-to-b from-indigo-950/80 via-purple-950/60 to-black/90"
          style={{ backgroundImage: currentSpot.image ? `url(${currentSpot.image})` : undefined }}
        >
          {!currentSpot.image && (
            <div className="flex flex-col items-center justify-center h-full text-8xl text-white/30">
              🏛️
              <p className="text-2xl mt-4">{currentSpot.name}</p>
            </div>
          )}
        </div>

        <div className="absolute top-8 left-8 right-8 bg-black/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 z-20 shadow-2xl">
          <h2 className="text-indigo-400 font-bold text-xl mb-3">{currentSpot.name}</h2>
          <p className="text-white/80 leading-relaxed">{currentSpot.description}</p>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-3 z-20">
          {currentNPC && (
            <button 
              className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-6 py-3 rounded-xl text-base font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(102,126,234,0.4)]"
              onClick={() => generateEntryDialog(currentSpot, currentNPC)}
            >
              💬 与 {currentNPC.name} 交谈
            </button>
          )}
          <button 
            className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-6 py-3 rounded-xl text-base font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(102,126,234,0.4)]"
            onClick={handleNextSpot}
          >
            ➡️ 前往下一站
          </button>
          <button 
            className="bg-white/10 text-white border-2 border-white/30 px-6 py-3 rounded-xl text-base font-semibold cursor-pointer transition-all hover:bg-white/15 hover:border-white/50"
            onClick={() => setPhase('returning')}
          >
            🏠 结束旅程返回
          </button>
        </div>

        {/* 热点区域 */}
        {currentSpot.hotspots?.map(hotspot => (
          <div
            key={hotspot.id}
            className="absolute cursor-pointer z-[15] flex flex-col items-center transition-transform hover:scale-125"
            style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
            onClick={() => alert(`探索: ${hotspot.name}\n${hotspot.description}`)}
          >
            <span className="text-3xl animate-pulse drop-shadow-[0_0_10px_rgba(102,126,234,0.5)]">
              {hotspot.type === 'photo' ? '📷' : hotspot.type === 'dialog' ? '💬' : '✨'}
            </span>
            <span className="bg-black/80 text-white px-3 py-1.5 rounded-lg text-sm mt-1 font-medium">
              {hotspot.name}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // 对话模式
  if (phase === 'dialog' && currentNPC && dialogLines.length > 0) {
    const currentLine = dialogLines[currentLineIndex];

    return (
      <div className="min-h-screen relative overflow-hidden bg-black cursor-pointer" onClick={handleContinue}>
        <div 
          className="absolute inset-0 bg-cover bg-center brightness-[0.7]"
          style={{ backgroundImage: currentSpot?.image ? `url(${currentSpot.image})` : undefined }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

        {/* NPC 立绘 */}
        <div className="absolute bottom-[200px] left-1/2 -translate-x-1/2 z-[15]">
          {currentNPC.sprite ? (
            <img src={currentNPC.sprite} alt={currentNPC.name} className="max-h-[400px] drop-shadow-2xl" />
          ) : (
            <div className="flex flex-col items-center text-[8rem] text-white/80 drop-shadow-[0_0_20px_rgba(102,126,234,0.3)]">
              👤
              <p className="text-2xl text-white mt-2 font-semibold">{currentNPC.name}</p>
            </div>
          )}
        </div>

        {/* 对话框 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-black/85 backdrop-blur-xl px-12 py-8 z-20 min-h-[200px] border-t-2 border-indigo-500/30">
          <div className="text-indigo-400 text-xl font-bold mb-3 drop-shadow-[0_0_10px_rgba(102,126,234,0.3)]">
            {currentLine?.speaker}
          </div>
          <div className="text-white text-lg leading-loose min-h-[80px] tracking-wide">
            {displayedText}
            {isTyping && <span className="animate-pulse text-indigo-400">▌</span>}
          </div>
          <div className="absolute bottom-4 right-8 text-white/50 text-sm animate-pulse">
            {isTyping ? '点击加速' : currentLineIndex < dialogLines.length - 1 ? '点击继续' : '点击结束对话'}
          </div>
        </div>
      </div>
    );
  }

  // 返程中
  if (phase === 'returning') {
    return (
      <div className="min-h-screen relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/30 via-pink-500/30 to-purple-900/50" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.2),transparent)] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 text-center text-white">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
            🌅 返程
          </h1>
          <p className="text-xl text-white/80 mb-8">带着美好的回忆踏上归途...</p>
          <div className="bg-black/50 backdrop-blur-xl p-8 rounded-2xl mb-8 border border-white/10">
            <h3 className="text-indigo-400 font-semibold text-xl mb-4">旅途回忆</h3>
            <p className="text-white/70 mb-2">访问了 {session?.visitedSpots.length || 0} 个景点</p>
            <p className="text-white/70">收集了 {session?.memories.length || 0} 个回忆</p>
          </div>
          <button 
            className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)]"
            onClick={handleCompleteTrip}
          >
            完成旅程
          </button>
        </div>
      </div>
    );
  }

  // 完成
  if (phase === 'completed') {
    return (
      <div className="min-h-screen relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/30 via-purple-600/30 to-black" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.3),transparent)] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 text-center text-white">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
            🎉 旅程完成！
          </h1>
          <p className="text-xl text-white/80 mb-8">感谢您的这次异世界冒险</p>

          <div className="flex flex-wrap justify-center gap-6 my-8">
            <div className="flex flex-col items-center bg-black/40 backdrop-blur-xl px-8 py-6 rounded-2xl border border-white/10 transition-all hover:-translate-y-1 hover:shadow-xl">
              <span className="text-4xl mb-2">🗺️</span>
              <span className="text-sm text-white/60 mb-1">景点</span>
              <span className="text-3xl font-bold text-indigo-400">{session?.visitedSpots.length || 0}</span>
            </div>
            <div className="flex flex-col items-center bg-black/40 backdrop-blur-xl px-8 py-6 rounded-2xl border border-white/10 transition-all hover:-translate-y-1 hover:shadow-xl">
              <span className="text-4xl mb-2">📸</span>
              <span className="text-sm text-white/60 mb-1">回忆</span>
              <span className="text-3xl font-bold text-indigo-400">{session?.memories.length || 0}</span>
            </div>
            <div className="flex flex-col items-center bg-black/40 backdrop-blur-xl px-8 py-6 rounded-2xl border border-white/10 transition-all hover:-translate-y-1 hover:shadow-xl">
              <span className="text-4xl mb-2">🎁</span>
              <span className="text-sm text-white/60 mb-1">物品</span>
              <span className="text-3xl font-bold text-indigo-400">{session?.items.length || 0}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-8">
            <button 
              className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)]"
              onClick={() => navigate('/worlds')}
            >
              🌍 探索更多世界
            </button>
            <button 
              className="bg-white/10 text-white border-2 border-white/30 px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all hover:bg-white/15 hover:border-white/50"
              onClick={handleGoHome}
            >
              🏠 返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 默认：探索
  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-black" />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 text-center text-white">
        <p className="text-white/70">加载中...</p>
      </div>
    </div>
  );
}
