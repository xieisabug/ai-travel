import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorlds } from '~/hooks/useWorlds';
import type { World, TravelProject } from '~/types/world';

type ViewState = 'worlds' | 'projects' | 'preparing' | 'generating';

// 生成阶段信息
const generationSteps = [
  { id: 1, label: '创建世界基础', icon: '🌍' },
  { id: 2, label: '生成旅游项目', icon: '🗺️' },
  { id: 3, label: '创建景点详情', icon: '🏛️' },
  { id: 4, label: '生成 NPC 角色', icon: '👥' },
  { id: 5, label: '绘制图片素材', icon: '🎨' },
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

  const [viewState, setViewState] = useState<ViewState>('worlds');
  const [playerName, setPlayerName] = useState('');
  const [selectedProject, setSelectedProject] = useState<TravelProject | null>(null);
  const [preparingMessage, setPreparingMessage] = useState('');
  const [currentGenStep, setCurrentGenStep] = useState(0);

  // 生成新世界
  const handleGenerateWorld = async () => {
    setViewState('generating');
    setCurrentGenStep(1);

    // 模拟进度更新（实际生成时间较长，提供视觉反馈）
    const progressInterval = setInterval(() => {
      setCurrentGenStep(prev => {
        if (prev < 5) return prev + 1;
        return prev;
      });
    }, 3000);

    const world = await generateWorld();

    clearInterval(progressInterval);

    if (world) {
      setCurrentGenStep(5);
      setTimeout(() => {
        setViewState('projects');
      }, 1000);
    } else {
      setViewState('worlds');
    }
  };

  // 选择已有世界
  const handleSelectWorld = async (worldId: string) => {
    const world = await selectWorld(worldId);
    if (world) {
      setViewState('projects');
    }
  };

  // 选择旅行项目
  const handleSelectProject = async (project: TravelProject) => {
    setSelectedProject(project);

    // 如果项目还没有生成详情，先生成
    if (project.generationStatus !== 'ready') {
      setPreparingMessage('正在生成旅行目的地详情...');
      setViewState('preparing');
      const updatedProject = await selectProject(project.id);
      if (updatedProject) {
        setSelectedProject(updatedProject);
        setPreparingMessage('详情生成完成！准备启程...');
      } else {
        setViewState('projects');
        return;
      }
    }
  };

  // 开始旅行
  const handleStartTravel = async () => {
    if (!selectedProject || !playerName.trim()) return;

    setPreparingMessage('正在准备您的旅程...');
    setViewState('preparing');

    const session = await createSession(selectedProject.id, playerName.trim());
    if (session) {
      // 导航到世界游戏页面
      navigate(`/world-game?session=${session.id}`);
    } else {
      setViewState('projects');
    }
  };

  // 返回世界列表
  const handleBackToWorlds = () => {
    setViewState('worlds');
    setSelectedProject(null);
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
              {currentGenStep > 0 && currentGenStep <= 5 && (
                <>
                  <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
                  <span>{generationSteps[currentGenStep - 1]?.label}...</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6">
            <p className="text-white/70 text-sm mb-1">💡 小提示：生成一个完整的世界大约需要 1-2 分钟</p>
            <p className="text-white/70 text-sm">包含世界设定、多个旅游项目、景点、NPC 和图片</p>
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
          {selectedProject && (
            <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-indigo-400 font-semibold mb-2">{selectedProject.name}</h3>
              <p className="text-white/70 text-sm">{selectedProject.description}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 渲染项目选择页
  if (viewState === 'projects' && currentWorld) {
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
              <p className="text-white/60 max-w-2xl mx-auto">{currentWorld.description}</p>
            </div>
            {currentWorld.imageUrl && (
              <img
                src={currentWorld.imageUrl}
                alt={currentWorld.name}
                className="w-full max-h-[300px] object-cover rounded-2xl border border-white/10"
              />
            )}
          </div>

          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-semibold text-indigo-400 mb-2">🧭 可选旅行项目</h2>
            <p className="text-white/50 mb-6">选择一个项目开始您的异世界之旅</p>

            {error && (
              <div 
                className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-lg mb-6 cursor-pointer text-center"
                onClick={clearError}
              >
                {error}（点击关闭）
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <div
                  key={project.id}
                  className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                  onClick={() => handleSelectProject(project)}
                >
                  {project.coverImage && (
                    <img
                      src={project.coverImage}
                      alt={project.name}
                      className="w-full h-44 object-cover"
                    />
                  )}
                  <div className="p-5">
                    <h3 className="text-indigo-400 font-semibold mb-2">{project.name}</h3>
                    <p className="text-white/60 text-sm mb-4 line-clamp-3">{project.description}</p>
                    <div className="flex justify-between text-xs text-white/40">
                      <span>难度: {project.difficulty}</span>
                      <span>行程: {project.duration || '?'}天</span>
                    </div>
                    {project.generationStatus === 'ready' && (
                      <span className="inline-block mt-3 px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-xs">
                        ✓ 已准备就绪
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedProject && selectedProject.generationStatus === 'ready' && (
              <div className="mt-8 p-8 bg-white/5 border border-white/10 rounded-2xl text-center">
                <h3 className="text-xl font-semibold mb-4">准备启程</h3>
                <div className="mb-6">
                  <label htmlFor="playerName" className="block mb-2 text-white/70">旅行者姓名</label>
                  <input
                    id="playerName"
                    type="text"
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    placeholder="输入您的名字"
                    maxLength={20}
                    className="w-full max-w-[300px] px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/10 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                <button
                  className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  onClick={handleStartTravel}
                  disabled={!playerName.trim() || isGenerating}
                >
                  {isGenerating ? '准备中...' : '🚀 开始旅程'}
                </button>
              </div>
            )}
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
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-8 relative">
          <button 
            className="absolute top-0 left-0 bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg cursor-pointer transition-all hover:bg-white/15 hover:border-white/30"
            onClick={() => navigate('/')}
          >
            ← 返回主页
          </button>
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
                    <div className="flex justify-between text-xs text-white/40">
                      <span>{world.travelProjects?.length || 0} 个旅行项目</span>
                      <span>{world.era || '未知纪元'}</span>
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
