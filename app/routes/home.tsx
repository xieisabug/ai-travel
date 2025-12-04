import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const worlds = [
  { id: 1, name: '云端之城', desc: '漂浮在天际的神秘都市', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', tag: '热门' },
  { id: 2, name: '深海王国', desc: '探索未知的海底文明', gradient: 'linear-gradient(135deg, #00c6fb 0%, #005bea 100%)', tag: '新上线' },
  { id: 3, name: '星际驿站', desc: '银河系边缘的补给站', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', tag: '精选' },
  { id: 4, name: '古老森林', desc: '神秘生物栖息的魔法丛林', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', tag: '推荐' },
];

const stats = [
  { number: '1000+', label: '独特世界' },
  { number: '50万+', label: '活跃探险者' },
  { number: '99.9%', label: '好评率' },
  { number: '24/7', label: '全天候服务' },
];

const testimonials = [
  { name: '李明', avatar: '🧑‍💻', role: '游戏设计师', content: '这是我体验过最沉浸式的虚拟旅行平台，每个世界都充满惊喜！' },
  { name: '张雪', avatar: '👩‍🎨', role: '插画师', content: '作为创作者，这里给了我无限的灵感，视觉效果简直太震撼了。' },
  { name: '王浩', avatar: '👨‍🚀', role: '科幻爱好者', content: '终于能亲身体验那些只存在于想象中的世界，太不可思议了！' },
];

export default function Home() {
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [activeWorld, setActiveWorld] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveWorld((prev) => (prev + 1) % worlds.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-page">
      {/* 背景装饰 */}
      <div className="bg-gradient"></div>
      <div className="bg-grid"></div>
      <div className="bg-glow"></div>

      {/* 导航栏 */}
      <nav className="nav">
        <div className="nav-logo">
          <span className="logo-icon">✦</span>
          Wanderlust
        </div>
        <div className="nav-links">
          <a href="#worlds">世界</a>
          <a href="#features">功能</a>
          <a href="#testimonials">评价</a>
          <a href="#about">关于</a>
          <button className="nav-login" onClick={() => setIsLoginOpen(true)}>
            登录
          </button>
        </div>
      </nav>

      {/* 主视觉区域 */}
      <section className={`hero ${isVisible ? 'visible' : ''}`}>
        <div className="hero-badge">
          <span className="badge-dot"></span>
          全新 2.0 版本现已上线
        </div>
        <div className="hero-content">
          <h1 className="hero-title">
            探索无限可能的
            <br />
            <span className="hero-highlight">虚拟世界</span>
          </h1>
          <p className="hero-subtitle">
            沉浸式的 AI 驱动旅行体验，让想象力带你去任何地方。<br />
            每个世界都是独一无二的冒险，每次探索都有新的发现。
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate('/worlds')}>
              <span>开始探索</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button className="btn-secondary" onClick={() => setIsLoginOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>观看演示</span>
            </button>
          </div>
          <div className="hero-stats">
            {stats.map((stat, i) => (
              <div key={i} className="stat-item">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-container">
            <div className="floating-cards">
              {worlds.map((world, i) => (
                <div 
                  key={world.id} 
                  className={`hero-card ${i === activeWorld ? 'active' : ''}`}
                  style={{ '--card-gradient': world.gradient } as React.CSSProperties}
                >
                  <div className="card-image"></div>
                  <div className="card-content">
                    <span className="card-tag">{world.tag}</span>
                    <h3>{world.name}</h3>
                    <p>{world.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="visual-orbit">
              <div className="orbit-ring"></div>
              <div className="orbit-ring"></div>
              <div className="orbit-ring"></div>
            </div>
          </div>
          <div className="world-indicators">
            {worlds.map((_, i) => (
              <button 
                key={i} 
                className={`indicator ${i === activeWorld ? 'active' : ''}`}
                onClick={() => setActiveWorld(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 世界展示区域 */}
      <section id="worlds" className="worlds-section">
        <div className="section-header">
          <span className="section-tag">精选世界</span>
          <h2>发现令人惊叹的目的地</h2>
          <p>每个世界都由 AI 精心构建，拥有独特的故事、角色和冒险</p>
        </div>
        <div className="worlds-grid">
          {worlds.map((world, i) => (
            <div 
              key={world.id} 
              className="world-card"
              style={{ '--delay': `${i * 0.1}s`, '--card-gradient': world.gradient } as React.CSSProperties}
            >
              <div className="world-image">
                <div className="world-overlay"></div>
                <span className="world-tag">{world.tag}</span>
              </div>
              <div className="world-info">
                <h3>{world.name}</h3>
                <p>{world.desc}</p>
                <button className="world-btn" onClick={() => navigate('/worlds')}>
                  进入世界
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="worlds-cta">
          <button className="btn-outline" onClick={() => navigate('/worlds')}>
            查看全部世界
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* 特性区域 */}
      <section id="features" className="features">
        <div className="section-header">
          <span className="section-tag">核心功能</span>
          <h2>为什么选择我们</h2>
          <p>每一次旅程都是独一无二的体验</p>
        </div>
        <div className="features-grid">
          <div className="feature-item feature-large">
            <div className="feature-visual">
              <div className="feature-demo">
                <div className="demo-screen">
                  <div className="demo-header"></div>
                  <div className="demo-content">
                    <div className="demo-avatar"></div>
                    <div className="demo-chat">
                      <div className="chat-bubble">你好，旅行者！欢迎来到云端之城。</div>
                      <div className="chat-bubble user">这里真的太美了！</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="feature-text">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h3>AI 驱动的沉浸式体验</h3>
              <p>每个世界都由先进的 AI 技术构建，角色拥有独特的个性和记忆。与他们交流，体验真正的互动故事。</p>
              <ul className="feature-list">
                <li>智能对话系统</li>
                <li>动态故事生成</li>
                <li>个性化冒险路线</li>
              </ul>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3>无限世界</h3>
            <p>从奇幻王国到科幻宇宙，每个世界都有独特的风景、文化和故事等你发现。新世界持续更新中。</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <h3>遇见角色</h3>
            <p>与形形色色的虚拟居民交流互动，每个角色都有自己的故事、性格和秘密等你发掘。</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
            </div>
            <h3>完成任务</h3>
            <p>接受挑战，完成任务，解锁隐藏内容。每个世界都有独特的成就系统等你征服。</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <h3>视觉盛宴</h3>
            <p>AI 生成的精美场景图片，让每一帧都如同艺术品。支持多种风格，从写实到动漫应有尽有。</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3>安全可靠</h3>
            <p>您的数据安全是我们的首要任务。采用企业级加密，确保您的旅程记录完全私密。</p>
          </div>
        </div>
      </section>

      {/* 用户评价 */}
      <section id="testimonials" className="testimonials">
        <div className="section-header">
          <span className="section-tag">用户评价</span>
          <h2>听听探险者们怎么说</h2>
          <p>来自全球各地的真实反馈</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((item, i) => (
            <div key={i} className="testimonial-card" style={{ '--delay': `${i * 0.1}s` } as React.CSSProperties}>
              <div className="testimonial-content">
                <div className="quote-icon">"</div>
                <p>{item.content}</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">{item.avatar}</div>
                <div className="author-info">
                  <div className="author-name">{item.name}</div>
                  <div className="author-role">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>准备好开始你的冒险了吗？</h2>
          <p>加入超过 50 万探险者，开启属于你的虚拟旅程</p>
          <div className="cta-actions">
            <button className="btn-primary btn-large" onClick={() => navigate('/worlds')}>
              <span>立即开始</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <span className="cta-note">免费体验，无需信用卡</span>
          </div>
        </div>
        <div className="cta-bg">
          <div className="cta-orb cta-orb-1"></div>
          <div className="cta-orb cta-orb-2"></div>
          <div className="cta-orb cta-orb-3"></div>
        </div>
      </section>

      {/* 底部 */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-icon">✦</span>
              Wanderlust
            </div>
            <p>让想象力带你去任何地方</p>
            <div className="footer-social">
              <a href="#" className="social-link">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="social-link">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
              </a>
              <a href="#" className="social-link">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/></svg>
              </a>
            </div>
          </div>
          <div className="footer-grid">
            <div className="footer-column">
              <h4>产品</h4>
              <a href="#worlds">世界探索</a>
              <a href="#features">功能介绍</a>
              <a href="#">定价方案</a>
              <a href="#">更新日志</a>
            </div>
            <div className="footer-column">
              <h4>公司</h4>
              <a href="#about">关于我们</a>
              <a href="#">加入团队</a>
              <a href="#">媒体报道</a>
              <a href="#">联系我们</a>
            </div>
            <div className="footer-column">
              <h4>支持</h4>
              <a href="#">帮助中心</a>
              <a href="#">社区论坛</a>
              <a href="#">API 文档</a>
              <a href="#">服务状态</a>
            </div>
            <div className="footer-column">
              <h4>法律</h4>
              <a href="#">隐私政策</a>
              <a href="#">服务条款</a>
              <a href="#">Cookie 政策</a>
              <a href="#">许可协议</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 Wanderlust. All rights reserved.</p>
          <div className="footer-lang">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
            <span>简体中文</span>
          </div>
        </div>
      </footer>

      {/* 登录弹窗 */}
      {isLoginOpen && (
        <div className="modal-overlay" onClick={() => setIsLoginOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsLoginOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <h2>欢迎回来</h2>
            <p className="modal-subtitle">登录以继续你的旅程</p>
            <form className="login-form" onSubmit={(e) => e.preventDefault()}>
              <div className="form-field">
                <label>邮箱</label>
                <input type="email" placeholder="your@email.com" />
              </div>
              <div className="form-field">
                <label>密码</label>
                <input type="password" placeholder="••••••••" />
              </div>
              <button type="submit" className="btn-primary full-width">
                登录
              </button>
            </form>
            <div className="modal-divider">
              <span>或</span>
            </div>
            <button className="btn-social">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              使用 GitHub 登录
            </button>
            <p className="modal-footer">
              还没有账号？<a href="#signup">立即注册</a>
            </p>
          </div>
        </div>
      )}

      <style>{`
        .home-page {
          min-height: 100vh;
          background: #000;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
          position: relative;
        }

        /* 背景装饰 */
        .bg-gradient {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(102, 126, 234, 0.15), transparent);
          pointer-events: none;
          z-index: 0;
        }

        .bg-grid {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
          z-index: 0;
        }

        .bg-glow {
          position: fixed;
          top: 50%;
          left: 50%;
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(118, 75, 162, 0.1) 0%, transparent 70%);
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 0;
        }

        /* 导航栏 */
        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 3rem;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: saturate(180%) blur(20px);
          -webkit-backdrop-filter: saturate(180%) blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .nav-logo {
          font-size: 1.25rem;
          font-weight: 600;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .logo-icon {
          font-size: 1.5rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 2.5rem;
        }

        .nav-links a {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: color 0.2s;
          position: relative;
        }

        .nav-links a::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 0.3s;
        }

        .nav-links a:hover {
          color: #fff;
        }

        .nav-links a:hover::after {
          width: 100%;
        }

        .nav-login {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.5rem 1.25rem;
          border-radius: 980px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-login:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        /* 主视觉区域 */
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6rem;
          padding: 10rem 3rem 6rem;
          position: relative;
          z-index: 1;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .hero.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(102, 126, 234, 0.1);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 980px;
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 1.5rem;
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          background: #667eea;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .hero-content {
          max-width: 600px;
        }

        .hero-title {
          font-size: 4.5rem;
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin-bottom: 1.5rem;
        }

        .hero-highlight {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.8;
          margin-bottom: 2.5rem;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 3rem;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          border: none;
          padding: 1rem 2rem;
          border-radius: 980px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-primary svg {
          width: 18px;
          height: 18px;
          transition: transform 0.3s;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:hover svg {
          transform: translateX(4px);
        }

        .btn-primary.full-width {
          width: 100%;
          justify-content: center;
        }

        .btn-primary.btn-large {
          padding: 1.25rem 2.5rem;
          font-size: 1.125rem;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1rem 2rem;
          border-radius: 980px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .btn-secondary svg {
          width: 16px;
          height: 16px;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .btn-outline {
          background: transparent;
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 1rem 2rem;
          border-radius: 980px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-outline svg {
          width: 18px;
          height: 18px;
          transition: transform 0.3s;
        }

        .btn-outline:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .btn-outline:hover svg {
          transform: translateX(4px);
        }

        .hero-stats {
          display: flex;
          gap: 3rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .stat-item {
          text-align: left;
        }

        .stat-number {
          font-size: 1.75rem;
          font-weight: 700;
          background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.7) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .stat-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 0.25rem;
        }

        .hero-visual {
          position: relative;
        }

        .visual-container {
          position: relative;
          width: 400px;
          height: 480px;
        }

        .floating-cards {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .hero-card {
          position: absolute;
          width: 320px;
          background: linear-gradient(145deg, rgba(30, 30, 40, 0.9) 0%, rgba(20, 20, 30, 0.9) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          overflow: hidden;
          opacity: 0;
          transform: scale(0.9) translateY(20px);
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow:
            0 50px 100px -20px rgba(0, 0, 0, 0.5),
            0 30px 60px -30px rgba(102, 126, 234, 0.3);
        }

        .hero-card.active {
          opacity: 1;
          transform: scale(1) translateY(0) rotateY(-5deg) rotateX(3deg);
        }

        .card-image {
          height: 200px;
          background: var(--card-gradient);
          position: relative;
          overflow: hidden;
        }

        .card-image::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 50%, rgba(0, 0, 0, 0.5) 100%);
        }

        .card-content {
          padding: 1.5rem;
        }

        .card-tag {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: rgba(102, 126, 234, 0.2);
          color: #667eea;
          border-radius: 980px;
          font-size: 0.75rem;
          font-weight: 500;
          margin-bottom: 0.75rem;
        }

        .card-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .card-content p {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.875rem;
        }

        .visual-orbit {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .orbit-ring {
          position: absolute;
          border: 1px solid rgba(102, 126, 234, 0.1);
          border-radius: 50%;
          animation: orbit 20s linear infinite;
        }

        .orbit-ring:nth-child(1) {
          width: 300px;
          height: 300px;
          top: -150px;
          left: -150px;
        }

        .orbit-ring:nth-child(2) {
          width: 450px;
          height: 450px;
          top: -225px;
          left: -225px;
          animation-duration: 30s;
          animation-direction: reverse;
        }

        .orbit-ring:nth-child(3) {
          width: 600px;
          height: 600px;
          top: -300px;
          left: -300px;
          animation-duration: 40s;
        }

        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .world-indicators {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          margin-top: 2rem;
        }

        .indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          cursor: pointer;
          transition: all 0.3s;
        }

        .indicator.active {
          background: #667eea;
          box-shadow: 0 0 12px rgba(102, 126, 234, 0.6);
        }

        /* 世界展示区域 */
        .worlds-section {
          padding: 8rem 3rem;
          position: relative;
          z-index: 1;
        }

        .section-tag {
          display: inline-block;
          padding: 0.375rem 1rem;
          background: rgba(102, 126, 234, 0.1);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 980px;
          font-size: 0.8125rem;
          color: #667eea;
          font-weight: 500;
          margin-bottom: 1rem;
        }

        .section-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .section-header h2 {
          font-size: 3rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
        }

        .section-header p {
          color: rgba(255, 255, 255, 0.5);
          font-size: 1.125rem;
          max-width: 600px;
          margin: 0 auto;
        }

        .worlds-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .world-card {
          background: linear-gradient(145deg, rgba(30, 30, 40, 0.6) 0%, rgba(20, 20, 30, 0.6) 100%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          animation: fadeInUp 0.6s var(--delay) both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .world-card:hover {
          transform: translateY(-8px);
          border-color: rgba(102, 126, 234, 0.3);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
        }

        .world-image {
          height: 180px;
          background: var(--card-gradient);
          position: relative;
          overflow: hidden;
        }

        .world-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 30%, rgba(0, 0, 0, 0.8) 100%);
        }

        .world-tag {
          position: absolute;
          top: 1rem;
          left: 1rem;
          padding: 0.25rem 0.75rem;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          border-radius: 980px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .world-info {
          padding: 1.25rem;
        }

        .world-info h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .world-info p {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .world-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          border: none;
          color: #667eea;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          transition: gap 0.3s;
        }

        .world-btn svg {
          width: 16px;
          height: 16px;
          transition: transform 0.3s;
        }

        .world-btn:hover {
          gap: 0.75rem;
        }

        .world-btn:hover svg {
          transform: translateX(2px);
        }

        .worlds-cta {
          display: flex;
          justify-content: center;
          margin-top: 3rem;
        }

        /* 特性区域 */
        .features {
          padding: 8rem 3rem;
          position: relative;
          z-index: 1;
          background: linear-gradient(180deg, transparent 0%, rgba(10, 10, 15, 0.8) 50%, transparent 100%);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .feature-item {
          padding: 2rem;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          transition: all 0.3s;
        }

        .feature-item:hover {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-4px);
        }

        .feature-item.feature-large {
          grid-column: span 3;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          padding: 3rem;
        }

        .feature-visual {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feature-demo {
          width: 100%;
          max-width: 400px;
        }

        .demo-screen {
          background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .demo-header {
          height: 40px;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          padding: 0 1rem;
          gap: 0.5rem;
        }

        .demo-header::before {
          content: '';
          display: flex;
          gap: 6px;
        }

        .demo-content {
          padding: 1.5rem;
        }

        .demo-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 50%;
          margin-bottom: 1rem;
        }

        .demo-chat {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .chat-bubble {
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 16px 16px 16px 4px;
          font-size: 0.875rem;
          max-width: 80%;
        }

        .chat-bubble.user {
          background: linear-gradient(135deg, #667eea, #764ba2);
          align-self: flex-end;
          border-radius: 16px 16px 4px 16px;
        }

        .feature-text {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }

        .feature-icon svg {
          width: 24px;
          height: 24px;
        }

        .feature-item h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .feature-item p {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.9375rem;
          line-height: 1.7;
        }

        .feature-list {
          list-style: none;
          padding: 0;
          margin-top: 1.5rem;
        }

        .feature-list li {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9375rem;
        }

        .feature-list li::before {
          content: '✓';
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: rgba(102, 126, 234, 0.2);
          color: #667eea;
          border-radius: 50%;
          font-size: 0.75rem;
        }

        /* 用户评价 */
        .testimonials {
          padding: 8rem 3rem;
          position: relative;
          z-index: 1;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .testimonial-card {
          padding: 2rem;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          transition: all 0.3s;
          animation: fadeInUp 0.6s var(--delay) both;
        }

        .testimonial-card:hover {
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-4px);
        }

        .testimonial-content {
          margin-bottom: 1.5rem;
        }

        .quote-icon {
          font-size: 3rem;
          line-height: 1;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }

        .testimonial-content p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1rem;
          line-height: 1.7;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .author-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .author-name {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .author-role {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
        }

        /* CTA 区域 */
        .cta-section {
          padding: 8rem 3rem;
          position: relative;
          z-index: 1;
          text-align: center;
          overflow: hidden;
        }

        .cta-content {
          position: relative;
          z-index: 2;
        }

        .cta-section h2 {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .cta-section p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.25rem;
          margin-bottom: 2.5rem;
        }

        .cta-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .cta-note {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.4);
        }

        .cta-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .cta-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
        }

        .cta-orb-1 {
          width: 400px;
          height: 400px;
          background: rgba(102, 126, 234, 0.3);
          top: 50%;
          left: 30%;
          transform: translate(-50%, -50%);
        }

        .cta-orb-2 {
          width: 300px;
          height: 300px;
          background: rgba(118, 75, 162, 0.3);
          top: 30%;
          right: 20%;
        }

        .cta-orb-3 {
          width: 250px;
          height: 250px;
          background: rgba(240, 147, 251, 0.2);
          bottom: 20%;
          right: 30%;
        }

        /* 底部 */
        .footer {
          padding: 5rem 3rem 2rem;
          background: rgba(0, 0, 0, 0.5);
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          position: relative;
          z-index: 1;
        }

        .footer-content {
          display: grid;
          grid-template-columns: 1.5fr 2fr;
          gap: 4rem;
          max-width: 1200px;
          margin: 0 auto 4rem;
        }

        .footer-logo {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .footer-brand p {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.9375rem;
          margin-bottom: 1.5rem;
        }

        .footer-social {
          display: flex;
          gap: 1rem;
        }

        .social-link {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.2s;
        }

        .social-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .social-link svg {
          width: 18px;
          height: 18px;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }

        .footer-column h4 {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .footer-column a {
          display: block;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          font-size: 0.875rem;
          padding: 0.375rem 0;
          transition: color 0.2s;
        }

        .footer-column a:hover {
          color: #fff;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          max-width: 1200px;
          margin: 0 auto;
        }

        .footer-bottom p {
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.8125rem;
        }

        .footer-lang {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.875rem;
        }

        .footer-lang svg {
          width: 16px;
          height: 16px;
        }

        /* 弹窗 */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 1rem;
        }

        .modal {
          background: linear-gradient(145deg, #1c1c1e 0%, #141416 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 2.5rem;
          width: 100%;
          max-width: 400px;
          position: relative;
          box-shadow: 0 50px 100px rgba(0, 0, 0, 0.5);
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: rotate(90deg);
        }

        .modal-close svg {
          width: 16px;
          height: 16px;
          color: rgba(255, 255, 255, 0.6);
        }

        .modal h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .modal-subtitle {
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 2rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-field label {
          font-size: 0.875rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
        }

        .form-field input {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 0.875rem 1rem;
          font-size: 1rem;
          color: #fff;
          transition: all 0.2s;
        }

        .form-field input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .form-field input:focus {
          outline: none;
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.1);
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .modal-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .modal-divider::before,
        .modal-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
        }

        .modal-divider span {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.875rem;
        }

        .btn-social {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 0.875rem;
          border-radius: 12px;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-social:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .btn-social svg {
          width: 20px;
          height: 20px;
        }

        .modal-footer {
          text-align: center;
          margin-top: 1.5rem;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.875rem;
        }

        .modal-footer a {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
        }

        .modal-footer a:hover {
          text-decoration: underline;
        }

        /* 响应式 */
        @media (max-width: 1200px) {
          .worlds-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .feature-item.feature-large {
            grid-column: span 3;
          }
        }

        @media (max-width: 1024px) {
          .hero {
            flex-direction: column;
            gap: 4rem;
            text-align: center;
            padding-top: 8rem;
          }

          .hero-title {
            font-size: 3rem;
          }

          .hero-actions {
            justify-content: center;
          }

          .hero-stats {
            justify-content: center;
            flex-wrap: wrap;
            gap: 2rem;
          }

          .visual-container {
            width: 320px;
            height: 400px;
          }

          .hero-card {
            width: 280px;
          }

          .features-grid {
            grid-template-columns: 1fr;
            max-width: 600px;
          }

          .feature-item.feature-large {
            grid-column: span 1;
            grid-template-columns: 1fr;
          }

          .testimonials-grid {
            grid-template-columns: 1fr;
            max-width: 600px;
          }

          .footer-content {
            grid-template-columns: 1fr;
            gap: 3rem;
          }

          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .worlds-grid {
            grid-template-columns: 1fr;
            max-width: 400px;
          }
        }

        @media (max-width: 640px) {
          .nav {
            padding: 1rem 1.5rem;
          }

          .nav-links a {
            display: none;
          }

          .hero {
            padding: 6rem 1.5rem 3rem;
          }

          .hero-badge {
            font-size: 0.75rem;
          }

          .hero-title {
            font-size: 2.25rem;
          }

          .hero-subtitle {
            font-size: 1rem;
          }

          .hero-actions {
            flex-direction: column;
          }

          .hero-stats {
            gap: 1.5rem;
          }

          .stat-number {
            font-size: 1.5rem;
          }

          .visual-container {
            width: 280px;
            height: 360px;
          }

          .hero-card {
            width: 260px;
          }

          .worlds-section,
          .features,
          .testimonials,
          .cta-section {
            padding: 4rem 1.5rem;
          }

          .section-header h2 {
            font-size: 2rem;
          }

          .cta-section h2 {
            font-size: 2rem;
          }

          .feature-item {
            padding: 1.5rem;
          }

          .footer {
            padding: 3rem 1.5rem 1.5rem;
          }

          .footer-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .footer-bottom {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
