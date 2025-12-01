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
      <div className="world-game loading-screen">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>正在准备您的旅程...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="world-game error-screen">
        <div className="error-content">
          <h2>😢 出错了</h2>
          <p>{error}</p>
          <button onClick={handleGoHome}>返回首页</button>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // 启程中
  if (phase === 'departing') {
    return (
      <div className="world-game departing-screen">
        <div className="scene-background departing"></div>
        <div className="content-overlay">
          <h1>🚀 启程</h1>
          <p>正在前往神秘的异世界...</p>
          <div className="travel-animation">
            <div className="plane">✈️</div>
          </div>
          <button onClick={() => setPhase('traveling')}>
            开始旅程
          </button>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // 旅途中
  if (phase === 'traveling') {
    return (
      <div className="world-game traveling-screen">
        <div className="scene-background traveling"></div>
        <div className="content-overlay">
          <h1>🌤️ 旅途中</h1>
          <p>穿越时空的缝隙，前往未知的世界...</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '50%' }}></div>
          </div>
          <button onClick={() => {
            setPhase('exploring');
            if (session) {
              loadSpot(session.projectId, session.currentSpotId || '');
            }
          }}>
            抵达目的地
          </button>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // 探索景点
  if (phase === 'exploring' && currentSpot) {
    return (
      <div className="world-game exploring-screen">
        <div
          className="scene-background exploring"
          style={{ backgroundImage: currentSpot.image ? `url(${currentSpot.image})` : undefined }}
        >
          {!currentSpot.image && (
            <div className="placeholder-scene">
              <span>🏛️</span>
              <p>{currentSpot.name}</p>
            </div>
          )}
        </div>

        <div className="spot-info">
          <h2>{currentSpot.name}</h2>
          <p>{currentSpot.description}</p>
        </div>

        <div className="action-buttons">
          {currentNPC && (
            <button onClick={() => generateEntryDialog(currentSpot, currentNPC)}>
              💬 与 {currentNPC.name} 交谈
            </button>
          )}
          <button onClick={handleNextSpot}>
            ➡️ 前往下一站
          </button>
          <button className="secondary" onClick={() => setPhase('returning')}>
            🏠 结束旅程返回
          </button>
        </div>

        {/* 热点区域 */}
        {currentSpot.hotspots?.map(hotspot => (
          <div
            key={hotspot.id}
            className="hotspot"
            style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
            onClick={() => alert(`探索: ${hotspot.name}\n${hotspot.description}`)}
          >
            <span className="hotspot-icon">
              {hotspot.type === 'photo' ? '📷' : hotspot.type === 'dialog' ? '💬' : '✨'}
            </span>
            <span className="hotspot-label">{hotspot.name}</span>
          </div>
        ))}

        <style>{styles}</style>
      </div>
    );
  }

  // 对话模式
  if (phase === 'dialog' && currentNPC && dialogLines.length > 0) {
    const currentLine = dialogLines[currentLineIndex];

    return (
      <div className="world-game dialog-screen" onClick={handleContinue}>
        <div
          className="scene-background dialog"
          style={{ backgroundImage: currentSpot?.image ? `url(${currentSpot.image})` : undefined }}
        ></div>

        {/* NPC 立绘 */}
        <div className="npc-sprite">
          {currentNPC.sprite ? (
            <img src={currentNPC.sprite} alt={currentNPC.name} />
          ) : (
            <div className="npc-placeholder">
              <span>👤</span>
              <p>{currentNPC.name}</p>
            </div>
          )}
        </div>

        {/* 对话框 */}
        <div className="dialog-box">
          <div className="speaker-name">{currentLine?.speaker}</div>
          <div className="dialog-text">
            {displayedText}
            {isTyping && <span className="cursor">▌</span>}
          </div>
          <div className="dialog-hint">
            {isTyping ? '点击加速' : currentLineIndex < dialogLines.length - 1 ? '点击继续' : '点击结束对话'}
          </div>
        </div>

        <style>{styles}</style>
      </div>
    );
  }

  // 返程中
  if (phase === 'returning') {
    return (
      <div className="world-game returning-screen">
        <div className="scene-background returning"></div>
        <div className="content-overlay">
          <h1>🌅 返程</h1>
          <p>带着美好的回忆踏上归途...</p>
          <div className="memories-summary">
            <h3>旅途回忆</h3>
            <p>访问了 {session?.visitedSpots.length || 0} 个景点</p>
            <p>收集了 {session?.memories.length || 0} 个回忆</p>
          </div>
          <button onClick={handleCompleteTrip}>
            完成旅程
          </button>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // 完成
  if (phase === 'completed') {
    return (
      <div className="world-game completed-screen">
        <div className="scene-background completed"></div>
        <div className="content-overlay">
          <h1>🎉 旅程完成！</h1>
          <p>感谢您的这次异世界冒险</p>

          <div className="trip-summary">
            <div className="summary-item">
              <span className="icon">🗺️</span>
              <span className="label">景点</span>
              <span className="value">{session?.visitedSpots.length || 0}</span>
            </div>
            <div className="summary-item">
              <span className="icon">📸</span>
              <span className="label">回忆</span>
              <span className="value">{session?.memories.length || 0}</span>
            </div>
            <div className="summary-item">
              <span className="icon">🎁</span>
              <span className="label">物品</span>
              <span className="value">{session?.items.length || 0}</span>
            </div>
          </div>

          <div className="final-actions">
            <button onClick={() => navigate('/worlds')}>
              🌍 探索更多世界
            </button>
            <button className="secondary" onClick={handleGoHome}>
              🏠 返回首页
            </button>
          </div>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // 默认：探索
  return (
    <div className="world-game">
      <div className="scene-background default"></div>
      <div className="content-overlay">
        <p>加载中...</p>
      </div>
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .world-game {
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    font-family: 'Microsoft YaHei', sans-serif;
  }

  .scene-background {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    z-index: 0;
  }

  .scene-background.departing {
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #e94560 100%);
  }

  .scene-background.traveling {
    background: linear-gradient(180deg, #0f3460 0%, #16213e 50%, #1a1a2e 100%);
    animation: traveling-bg 10s linear infinite;
  }

  @keyframes traveling-bg {
    0% { background-position: 0% 0%; }
    100% { background-position: 100% 100%; }
  }

  .scene-background.exploring {
    background: linear-gradient(180deg, #2a4a6a 0%, #1a3a5a 50%, #0a2a4a 100%);
  }

  .scene-background.dialog {
    filter: brightness(0.7);
  }

  .scene-background.returning {
    background: linear-gradient(180deg, #ff9a56 0%, #e94560 50%, #533483 100%);
  }

  .scene-background.completed {
    background: linear-gradient(180deg, #4ecca3 0%, #45b7d1 50%, #533483 100%);
  }

  .placeholder-scene {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 6rem;
    color: rgba(255,255,255,0.3);
  }

  .placeholder-scene p {
    font-size: 1.5rem;
    margin-top: 1rem;
  }

  .content-overlay {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
    text-align: center;
    color: #fff;
  }

  .content-overlay h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  }

  .content-overlay p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    color: rgba(255,255,255,0.8);
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255,255,255,0.2);
    border-top-color: #4ecca3;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .travel-animation {
    margin: 2rem 0;
  }

  .plane {
    font-size: 3rem;
    animation: fly 2s ease-in-out infinite;
  }

  @keyframes fly {
    0%, 100% { transform: translateY(0) rotate(-10deg); }
    50% { transform: translateY(-20px) rotate(10deg); }
  }

  .progress-bar {
    width: 300px;
    height: 8px;
    background: rgba(255,255,255,0.2);
    border-radius: 4px;
    overflow: hidden;
    margin: 2rem 0;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4ecca3, #45b7d1);
    border-radius: 4px;
    transition: width 0.5s;
  }

  button {
    background: linear-gradient(135deg, #4ecca3 0%, #45b7d1 100%);
    border: none;
    color: #fff;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s;
    margin: 0.5rem;
  }

  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(78,204,163,0.3);
  }

  button.secondary {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.3);
  }

  button.secondary:hover {
    background: rgba(255,255,255,0.2);
  }

  /* 探索页面 */
  .exploring-screen {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .spot-info {
    position: absolute;
    top: 2rem;
    left: 2rem;
    right: 2rem;
    background: rgba(0,0,0,0.7);
    padding: 1.5rem;
    border-radius: 16px;
    color: #fff;
    z-index: 20;
  }

  .spot-info h2 {
    color: #4ecca3;
    margin-bottom: 0.5rem;
  }

  .action-buttons {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    z-index: 20;
  }

  .hotspot {
    position: absolute;
    cursor: pointer;
    z-index: 15;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.3s;
  }

  .hotspot:hover {
    transform: scale(1.2);
  }

  .hotspot-icon {
    font-size: 2rem;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  .hotspot-label {
    background: rgba(0,0,0,0.7);
    color: #fff;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    margin-top: 0.25rem;
  }

  /* 对话页面 */
  .dialog-screen {
    cursor: pointer;
  }

  .npc-sprite {
    position: absolute;
    bottom: 200px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 15;
  }

  .npc-sprite img {
    max-height: 400px;
    filter: drop-shadow(0 0 20px rgba(0,0,0,0.5));
  }

  .npc-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 8rem;
    color: rgba(255,255,255,0.8);
  }

  .npc-placeholder p {
    font-size: 1.5rem;
    color: #fff;
    margin-top: 0.5rem;
  }

  .dialog-box {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%);
    padding: 2rem;
    z-index: 20;
    min-height: 180px;
  }

  .speaker-name {
    color: #4ecca3;
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .dialog-text {
    color: #fff;
    font-size: 1.1rem;
    line-height: 1.8;
    min-height: 80px;
  }

  .cursor {
    animation: blink 0.5s infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  .dialog-hint {
    position: absolute;
    bottom: 1rem;
    right: 2rem;
    color: rgba(255,255,255,0.5);
    font-size: 0.9rem;
  }

  /* 回忆总结 */
  .memories-summary {
    background: rgba(0,0,0,0.5);
    padding: 2rem;
    border-radius: 16px;
    margin: 2rem 0;
  }

  .memories-summary h3 {
    color: #4ecca3;
    margin-bottom: 1rem;
  }

  /* 完成页面 */
  .trip-summary {
    display: flex;
    gap: 2rem;
    margin: 2rem 0;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(0,0,0,0.3);
    padding: 1.5rem 2rem;
    border-radius: 16px;
  }

  .summary-item .icon {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  .summary-item .label {
    font-size: 0.9rem;
    color: rgba(255,255,255,0.7);
  }

  .summary-item .value {
    font-size: 2rem;
    font-weight: bold;
    color: #4ecca3;
  }

  .final-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 2rem;
  }

  /* 响应式 */
  @media (max-width: 768px) {
    .content-overlay h1 {
      font-size: 2rem;
    }

    .trip-summary {
      flex-direction: column;
      gap: 1rem;
    }

    .spot-info {
      top: 1rem;
      left: 1rem;
      right: 1rem;
      padding: 1rem;
    }

    .dialog-box {
      padding: 1.5rem;
    }

    .npc-sprite {
      bottom: 180px;
    }

    .npc-sprite img {
      max-height: 250px;
    }
  }

  /* Loading & Error */
  .loading-screen, .error-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: #fff;
  }

  .loading-content, .error-content {
    text-align: center;
  }

  .error-content h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }
`;
