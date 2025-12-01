import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorlds } from '~/hooks/useWorlds';
import type { World, TravelProject } from '~/types/world';

type ViewState = 'worlds' | 'projects' | 'preparing';

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

  // 生成新世界
  const handleGenerateWorld = async () => {
    const world = await generateWorld();
    if (world) {
      setViewState('projects');
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
      <div className="worlds-page loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>正在探索异世界...</p>
        </div>
      </div>
    );
  }

  // 渲染准备中状态
  if (viewState === 'preparing') {
    return (
      <div className="worlds-page preparing">
        <div className="preparing-container">
          <div className="spinner large"></div>
          <h2>{preparingMessage}</h2>
          {selectedProject && (
            <div className="project-preview">
              <h3>{selectedProject.name}</h3>
              <p>{selectedProject.description}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 渲染项目选择页
  if (viewState === 'projects' && currentWorld) {
    return (
      <div className="worlds-page projects-view">
        <div className="world-header">
          <button className="back-button" onClick={handleBackToWorlds}>
            ← 返回世界列表
          </button>
          <div className="world-info">
            <h1>{currentWorld.name}</h1>
            <p className="world-description">{currentWorld.description}</p>
          </div>
          {currentWorld.imageUrl && (
            <img
              src={currentWorld.imageUrl}
              alt={currentWorld.name}
              className="world-banner"
            />
          )}
        </div>

        <div className="projects-section">
          <h2>🧭 可选旅行项目</h2>
          <p className="section-hint">选择一个项目开始您的异世界之旅</p>

          {error && (
            <div className="error-message" onClick={clearError}>
              {error}（点击关闭）
            </div>
          )}

          <div className="projects-grid">
            {projects.map(project => (
              <div
                key={project.id}
                className={`project-card ${project.generationStatus === 'ready' ? 'ready' : ''}`}
                onClick={() => handleSelectProject(project)}
              >
                {project.coverImage && (
                  <img
                    src={project.coverImage}
                    alt={project.name}
                    className="project-image"
                  />
                )}
                <div className="project-content">
                  <h3>{project.name}</h3>
                  <p className="project-summary">{project.description}</p>
                  <div className="project-meta">
                    <span className="difficulty">难度: {project.difficulty}</span>
                    <span className="duration">
                      行程: {project.duration || '?'}天
                    </span>
                  </div>
                  {project.generationStatus === 'ready' && (
                    <span className="ready-badge">✓ 已准备就绪</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedProject && selectedProject.generationStatus === 'ready' && (
            <div className="start-travel-form">
              <h3>准备启程</h3>
              <div className="form-group">
                <label htmlFor="playerName">旅行者姓名</label>
                <input
                  id="playerName"
                  type="text"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder="输入您的名字"
                  maxLength={20}
                />
              </div>
              <button
                className="start-button"
                onClick={handleStartTravel}
                disabled={!playerName.trim() || isGenerating}
              >
                {isGenerating ? '准备中...' : '🚀 开始旅程'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 渲染世界列表页
  return (
    <div className="worlds-page worlds-view">
      <div className="page-header">
        <h1>🌍 异世界探索</h1>
        <p>发现由 AI 创造的奇幻世界，开启独一无二的旅程</p>
        <button className="home-button" onClick={() => navigate('/')}>
          ← 返回主页
        </button>
      </div>

      {error && (
        <div className="error-message" onClick={clearError}>
          {error}（点击关闭）
        </div>
      )}

      <div className="actions-section">
        <button
          className="generate-button"
          onClick={handleGenerateWorld}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="spinner small"></span>
              正在创造新世界...
            </>
          ) : (
            '✨ 创造新世界'
          )}
        </button>
      </div>

      <div className="worlds-section">
        <h2>已发现的世界</h2>

        {worlds.length === 0 ? (
          <div className="empty-state">
            <p>还没有发现任何世界</p>
            <p>点击上方按钮创造您的第一个异世界吧！</p>
          </div>
        ) : (
          <div className="worlds-grid">
            {worlds.map(world => (
              <div
                key={world.id}
                className="world-card"
                onClick={() => handleSelectWorld(world.id)}
              >
                {world.imageUrl ? (
                  <img
                    src={world.imageUrl}
                    alt={world.name}
                    className="world-image"
                  />
                ) : (
                  <div className="world-image placeholder">
                    <span>🌌</span>
                  </div>
                )}
                <div className="world-content">
                  <h3>{world.name}</h3>
                  <p className="world-description">{world.description}</p>
                  <div className="world-meta">
                    <span>{world.travelProjects?.length || 0} 个旅行项目</span>
                    <span>{world.era || '未知纪元'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .worlds-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          color: #fff;
          padding: 2rem;
        }

        .loading, .preparing {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-spinner, .preparing-container {
          text-align: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255,255,255,0.2);
          border-top-color: #4ecca3;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        .spinner.large {
          width: 60px;
          height: 60px;
        }

        .spinner.small {
          width: 16px;
          height: 16px;
          border-width: 2px;
          display: inline-block;
          margin-right: 0.5rem;
          vertical-align: middle;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .page-header {
          text-align: center;
          margin-bottom: 2rem;
          position: relative;
        }

        .page-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .home-button, .back-button {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .home-button:hover, .back-button:hover {
          background: rgba(255,255,255,0.2);
        }

        .page-header .home-button {
          position: absolute;
          top: 0;
          left: 0;
        }

        .error-message {
          background: rgba(255,107,107,0.2);
          border: 1px solid #ff6b6b;
          color: #ff6b6b;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          cursor: pointer;
          text-align: center;
        }

        .actions-section {
          text-align: center;
          margin-bottom: 2rem;
        }

        .generate-button {
          background: linear-gradient(135deg, #4ecca3 0%, #45b7d1 100%);
          border: none;
          color: #fff;
          padding: 1rem 2rem;
          font-size: 1.2rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
        }

        .generate-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(78,204,163,0.3);
        }

        .generate-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .worlds-section, .projects-section {
          max-width: 1200px;
          margin: 0 auto;
        }

        .worlds-section h2, .projects-section h2 {
          margin-bottom: 1rem;
        }

        .section-hint {
          color: rgba(255,255,255,0.6);
          margin-bottom: 1.5rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          background: rgba(255,255,255,0.05);
          border-radius: 16px;
          color: rgba(255,255,255,0.6);
        }

        .worlds-grid, .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .world-card, .project-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s;
        }

        .world-card:hover, .project-card:hover {
          transform: translateY(-4px);
          border-color: #4ecca3;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .world-image, .project-image {
          width: 100%;
          height: 180px;
          object-fit: cover;
        }

        .world-image.placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #2a2a4a 0%, #1a1a3a 100%);
          font-size: 4rem;
        }

        .world-content, .project-content {
          padding: 1.5rem;
        }

        .world-content h3, .project-content h3 {
          margin-bottom: 0.5rem;
          color: #4ecca3;
        }

        .world-description, .project-summary {
          color: rgba(255,255,255,0.7);
          font-size: 0.9rem;
          margin-bottom: 1rem;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .world-meta, .project-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.5);
        }

        .ready-badge {
          display: inline-block;
          margin-top: 0.5rem;
          padding: 0.25rem 0.5rem;
          background: rgba(78,204,163,0.2);
          color: #4ecca3;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .world-header {
          margin-bottom: 2rem;
        }

        .world-info {
          text-align: center;
          margin: 1rem 0;
        }

        .world-info h1 {
          font-size: 2rem;
          color: #4ecca3;
        }

        .world-banner {
          width: 100%;
          max-height: 300px;
          object-fit: cover;
          border-radius: 16px;
        }

        .start-travel-form {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 2rem;
          margin-top: 2rem;
          text-align: center;
        }

        .form-group {
          margin: 1rem 0;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: rgba(255,255,255,0.8);
        }

        .form-group input {
          width: 100%;
          max-width: 300px;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          background: rgba(255,255,255,0.1);
          color: #fff;
        }

        .form-group input::placeholder {
          color: rgba(255,255,255,0.4);
        }

        .form-group input:focus {
          outline: none;
          border-color: #4ecca3;
        }

        .start-button {
          background: linear-gradient(135deg, #4ecca3 0%, #45b7d1 100%);
          border: none;
          color: #fff;
          padding: 1rem 3rem;
          font-size: 1.2rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 1rem;
        }

        .start-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(78,204,163,0.3);
        }

        .start-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .project-preview {
          margin-top: 2rem;
          padding: 1rem;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
        }

        .project-preview h3 {
          color: #4ecca3;
          margin-bottom: 0.5rem;
        }

        .project-preview p {
          color: rgba(255,255,255,0.7);
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .worlds-page {
            padding: 1rem;
          }

          .page-header h1 {
            font-size: 1.8rem;
          }

          .page-header .home-button {
            position: static;
            margin-bottom: 1rem;
          }

          .worlds-grid, .projects-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
