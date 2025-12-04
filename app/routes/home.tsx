import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthModal, UserInfo } from '~/components/AuthModal';
import { useAuthContext } from '~/hooks/useAuth';

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
  const { isAuthenticated, user } = useAuthContext();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'register'>('login');
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
    <div className="min-h-screen bg-black text-white font-sans antialiased overflow-x-hidden relative">
      {/* 背景装饰 */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.15),transparent)] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none z-0" />
      <div className="fixed top-1/2 left-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(118,75,162,0.1)_0%,transparent_70%)] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" />

      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 py-4 bg-black/60 backdrop-blur-xl backdrop-saturate-150 border-b border-white/5">
        <div className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <span className="text-2xl bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent">✦</span>
          云旅游
        </div>
        <div className="flex items-center gap-10">
          <a href="#worlds" className="text-white/70 text-sm font-medium hover:text-white transition-colors relative group">
            世界
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 transition-all group-hover:w-full" />
          </a>
          <a href="#features" className="text-white/70 text-sm font-medium hover:text-white transition-colors relative group">
            功能
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 transition-all group-hover:w-full" />
          </a>
          <a href="#testimonials" className="text-white/70 text-sm font-medium hover:text-white transition-colors relative group">
            评价
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 transition-all group-hover:w-full" />
          </a>
          <a href="#about" className="text-white/70 text-sm font-medium hover:text-white transition-colors relative group">
            关于
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 transition-all group-hover:w-full" />
          </a>
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin/worlds')}
                  className="text-white/70 text-sm font-medium hover:text-white transition-colors relative group"
                >
                  管理后台
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 transition-all group-hover:w-full" />
                </button>
              )}
              <UserInfo />
            </div>
          ) : (
            <button
              className="bg-white/10 text-white border border-white/20 px-5 py-2 rounded-full text-sm font-medium cursor-pointer transition-all hover:bg-white/15 hover:border-white/30"
              onClick={() => setIsLoginOpen(true)}
            >
              登录
            </button>
          )}
        </div>
      </nav>

      {/* 主视觉区域 */}
      <section className={`min-h-screen flex items-center justify-center gap-24 pt-40 pb-24 px-12 relative z-[1] transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-sm text-white/80 mb-6">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
          全新 2.0 版本现已上线
        </div>
        <div className="max-w-[600px]">
          <h1 className="text-7xl font-bold leading-[1.1] tracking-tight mb-6">
            探索无限可能的
            <br />
            <span className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-400 bg-clip-text text-transparent">虚拟世界</span>
          </h1>
          <p className="text-xl text-white/60 leading-relaxed mb-10">
            沉浸式的 AI 驱动旅行体验，让想象力带你去任何地方。<br />
            每个世界都是独一无二的冒险，每次探索都有新的发现。
          </p>
          <div className="flex gap-4 mb-12">
            <button 
              className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-8 py-4 rounded-full text-base font-medium cursor-pointer transition-all flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)] group"
              onClick={() => navigate('/worlds')}
            >
              <span>开始探索</span>
              <svg className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button 
              className="bg-white/5 text-white border border-white/10 px-8 py-4 rounded-full text-base font-medium cursor-pointer transition-all flex items-center gap-3 hover:bg-white/10 hover:border-white/20"
              onClick={() => setIsLoginOpen(true)}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>观看演示</span>
            </button>
          </div>
          <div className="flex gap-12 pt-8 border-t border-white/[0.08]">
            {stats.map((stat, i) => (
              <div key={i} className="text-left">
                <div className="text-3xl font-bold bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">{stat.number}</div>
                <div className="text-sm text-white/50 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="relative w-[400px] h-[480px]">
            <div className="relative w-full h-full">
              {worlds.map((world, i) => (
                <div 
                  key={world.id} 
                  className={`absolute w-80 bg-gradient-to-br from-[rgba(30,30,40,0.9)] to-[rgba(20,20,30,0.9)] border border-white/10 rounded-3xl overflow-hidden transition-all duration-500 ease-out shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5),0_30px_60px_-30px_rgba(102,126,234,0.3)] ${i === activeWorld ? 'opacity-100 scale-100 translate-y-0 [transform:rotateY(-5deg)_rotateX(3deg)]' : 'opacity-0 scale-90 translate-y-5'}`}
                  style={{ '--card-gradient': world.gradient } as React.CSSProperties}
                >
                  <div className="h-[200px] relative overflow-hidden" style={{ background: world.gradient }}>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
                  </div>
                  <div className="p-6">
                    <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-medium mb-3">{world.tag}</span>
                    <h3 className="text-xl font-semibold mb-2">{world.name}</h3>
                    <p className="text-white/50 text-sm">{world.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="absolute w-[300px] h-[300px] -top-[150px] -left-[150px] border border-indigo-500/10 rounded-full animate-spin-slow" />
              <div className="absolute w-[450px] h-[450px] -top-[225px] -left-[225px] border border-indigo-500/10 rounded-full animate-spin-slower-reverse" />
              <div className="absolute w-[600px] h-[600px] -top-[300px] -left-[300px] border border-indigo-500/10 rounded-full animate-spin-slowest" />
            </div>
          </div>
          <div className="flex gap-2 justify-center mt-8">
            {worlds.map((_, i) => (
              <button 
                key={i} 
                className={`w-2 h-2 rounded-full border-none cursor-pointer transition-all ${i === activeWorld ? 'bg-indigo-500 shadow-[0_0_12px_rgba(102,126,234,0.6)]' : 'bg-white/20'}`}
                onClick={() => setActiveWorld(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 世界展示区域 */}
      <section id="worlds" className="py-32 px-12 relative z-[1]">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-sm text-indigo-400 font-medium mb-4">精选世界</span>
          <h2 className="text-5xl font-bold tracking-tight mb-4">发现令人惊叹的目的地</h2>
          <p className="text-white/50 text-lg max-w-[600px] mx-auto">每个世界都由 AI 精心构建，拥有独特的故事、角色和冒险</p>
        </div>
        <div className="grid grid-cols-4 gap-6 max-w-[1400px] mx-auto">
          {worlds.map((world, i) => (
            <div 
              key={world.id} 
              className="bg-gradient-to-br from-[rgba(30,30,40,0.6)] to-[rgba(20,20,30,0.6)] border border-white/[0.06] rounded-[20px] overflow-hidden transition-all duration-400 ease-out hover:-translate-y-2 hover:border-indigo-500/30 hover:shadow-[0_30px_60px_rgba(0,0,0,0.3)] animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="h-[180px] relative overflow-hidden" style={{ background: world.gradient }}>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(0,0,0,0)] to-black/80" />
                <span className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs font-medium">{world.tag}</span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold mb-2">{world.name}</h3>
                <p className="text-white/50 text-sm mb-4">{world.desc}</p>
                <button 
                  className="flex items-center gap-2 bg-transparent border-none text-indigo-400 text-sm font-medium cursor-pointer p-0 transition-all hover:gap-3 group"
                  onClick={() => navigate('/worlds')}
                >
                  进入世界
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-12">
          <button 
            className="bg-transparent text-white border border-white/20 px-8 py-4 rounded-full text-base font-medium cursor-pointer transition-all flex items-center gap-2 hover:bg-white/5 hover:border-white/30 group"
            onClick={() => navigate('/worlds')}
          >
            查看全部世界
            <svg className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* 特性区域 */}
      <section id="features" className="py-32 px-12 relative z-[1] bg-gradient-to-b from-transparent via-[rgba(10,10,15,0.8)] to-transparent">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-sm text-indigo-400 font-medium mb-4">核心功能</span>
          <h2 className="text-5xl font-bold tracking-tight mb-4">为什么选择我们</h2>
          <p className="text-white/50 text-lg max-w-[600px] mx-auto">每一次旅程都是独一无二的体验</p>
        </div>
        <div className="grid grid-cols-3 gap-6 max-w-[1200px] mx-auto">
          <div className="col-span-3 grid grid-cols-2 gap-12 p-12 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] rounded-[20px] transition-all hover:bg-gradient-to-br hover:from-white/[0.05] hover:to-white/[0.02] hover:border-white/10 hover:-translate-y-1">
            <div className="flex items-center justify-center">
              <div className="w-full max-w-[400px]">
                <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl overflow-hidden border border-white/10">
                  <div className="h-10 bg-black/30 flex items-center px-4 gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-500/60" />
                      <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <span className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4" />
                    <div className="flex flex-col gap-3">
                      <div className="px-4 py-3 bg-white/10 rounded-2xl rounded-bl-sm text-sm max-w-[80%]">你好，旅行者！欢迎来到云端之城。</div>
                      <div className="px-4 py-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl rounded-br-sm text-sm max-w-[80%] self-end">这里真的太美了！</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mb-6">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">AI 驱动的沉浸式体验</h3>
              <p className="text-white/50 text-[15px] leading-relaxed">每个世界都由先进的 AI 技术构建，角色拥有独特的个性和记忆。与他们交流，体验真正的互动故事。</p>
              <ul className="list-none p-0 mt-6 space-y-2">
                <li className="flex items-center gap-3 text-white/70 text-[15px]">
                  <span className="w-5 h-5 flex items-center justify-center bg-indigo-500/20 text-indigo-400 rounded-full text-xs">✓</span>
                  智能对话系统
                </li>
                <li className="flex items-center gap-3 text-white/70 text-[15px]">
                  <span className="w-5 h-5 flex items-center justify-center bg-indigo-500/20 text-indigo-400 rounded-full text-xs">✓</span>
                  动态故事生成
                </li>
                <li className="flex items-center gap-3 text-white/70 text-[15px]">
                  <span className="w-5 h-5 flex items-center justify-center bg-indigo-500/20 text-indigo-400 rounded-full text-xs">✓</span>
                  个性化冒险路线
                </li>
              </ul>
            </div>
          </div>
          <div className="p-8 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] rounded-[20px] transition-all hover:bg-gradient-to-br hover:from-white/[0.05] hover:to-white/[0.02] hover:border-white/10 hover:-translate-y-1">
            <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mb-6">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">无限世界</h3>
            <p className="text-white/50 text-[15px] leading-relaxed">从奇幻王国到科幻宇宙，每个世界都有独特的风景、文化和故事等你发现。新世界持续更新中。</p>
          </div>
          <div className="p-8 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] rounded-[20px] transition-all hover:bg-gradient-to-br hover:from-white/[0.05] hover:to-white/[0.02] hover:border-white/10 hover:-translate-y-1">
            <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mb-6">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">遇见角色</h3>
            <p className="text-white/50 text-[15px] leading-relaxed">与形形色色的虚拟居民交流互动，每个角色都有自己的故事、性格和秘密等你发掘。</p>
          </div>
          <div className="p-8 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] rounded-[20px] transition-all hover:bg-gradient-to-br hover:from-white/[0.05] hover:to-white/[0.02] hover:border-white/10 hover:-translate-y-1">
            <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mb-6">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">完成任务</h3>
            <p className="text-white/50 text-[15px] leading-relaxed">接受挑战，完成任务，解锁隐藏内容。每个世界都有独特的成就系统等你征服。</p>
          </div>
          <div className="p-8 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] rounded-[20px] transition-all hover:bg-gradient-to-br hover:from-white/[0.05] hover:to-white/[0.02] hover:border-white/10 hover:-translate-y-1">
            <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mb-6">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">视觉盛宴</h3>
            <p className="text-white/50 text-[15px] leading-relaxed">AI 生成的精美场景图片，让每一帧都如同艺术品。支持多种风格，从写实到动漫应有尽有。</p>
          </div>
          <div className="p-8 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] rounded-[20px] transition-all hover:bg-gradient-to-br hover:from-white/[0.05] hover:to-white/[0.02] hover:border-white/10 hover:-translate-y-1">
            <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mb-6">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">安全可靠</h3>
            <p className="text-white/50 text-[15px] leading-relaxed">您的数据安全是我们的首要任务。采用企业级加密，确保您的旅程记录完全私密。</p>
          </div>
        </div>
      </section>

      {/* 用户评价 */}
      <section id="testimonials" className="py-32 px-12 relative z-[1]">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-sm text-indigo-400 font-medium mb-4">用户评价</span>
          <h2 className="text-5xl font-bold tracking-tight mb-4">听听探险者们怎么说</h2>
          <p className="text-white/50 text-lg max-w-[600px] mx-auto">来自全球各地的真实反馈</p>
        </div>
        <div className="grid grid-cols-3 gap-6 max-w-[1200px] mx-auto">
          {testimonials.map((item, i) => (
            <div 
              key={i} 
              className="p-8 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] rounded-[20px] transition-all hover:border-white/10 hover:-translate-y-1 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="mb-6">
                <div className="text-5xl leading-none bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent mb-2">"</div>
                <p className="text-white/80 text-base leading-relaxed">{item.content}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full flex items-center justify-center text-2xl">{item.avatar}</div>
                <div>
                  <div className="font-semibold mb-1">{item.name}</div>
                  <div className="text-sm text-white/50">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="py-32 px-12 relative z-[1] text-center overflow-hidden">
        <div className="relative z-[2]">
          <h2 className="text-5xl font-bold mb-4">准备好开始你的冒险了吗？</h2>
          <p className="text-white/60 text-xl mb-10">加入超过 50 万探险者，开启属于你的虚拟旅程</p>
          <div className="flex flex-col items-center gap-4">
            <button 
              className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-10 py-5 rounded-full text-lg font-medium cursor-pointer transition-all flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)] group"
              onClick={() => navigate('/worlds')}
            >
              <span>立即开始</span>
              <svg className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <span className="text-sm text-white/40">免费体验，无需信用卡</span>
          </div>
        </div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-[400px] h-[400px] bg-indigo-500/30 rounded-full blur-[80px] top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute w-[300px] h-[300px] bg-purple-600/30 rounded-full blur-[80px] top-[30%] right-[20%]" />
          <div className="absolute w-[250px] h-[250px] bg-pink-400/20 rounded-full blur-[80px] bottom-[20%] right-[30%]" />
        </div>
      </section>

      {/* 底部 */}
      <footer className="pt-20 pb-8 px-12 bg-black/50 border-t border-white/[0.06] relative z-[1]">
        <div className="grid grid-cols-[1.5fr_2fr] gap-16 max-w-[1200px] mx-auto mb-16">
          <div>
            <div className="text-2xl font-semibold mb-3 flex items-center gap-2">
              <span className="text-2xl bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent">✦</span>
              云旅游
            </div>
            <p className="text-white/40 text-[15px] mb-6">让想象力带你去任何地方</p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-[10px] text-white/60 transition-all hover:bg-white/10 hover:text-white">
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-[10px] text-white/60 transition-all hover:bg-white/10 hover:text-white">
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-[10px] text-white/60 transition-all hover:bg-white/10 hover:text-white">
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/></svg>
              </a>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-8">
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white/90">产品</h4>
              <a href="#worlds" className="block text-white/50 text-sm py-1.5 transition-colors hover:text-white">世界探索</a>
              <a href="#features" className="block text-white/50 text-sm py-1.5 transition-colors hover:text-white">功能介绍</a>
              <a href="#" className="block text-white/50 text-sm py-1.5 transition-colors hover:text-white">定价方案</a>
              <a href="#" className="block text-white/50 text-sm py-1.5 transition-colors hover:text-white">更新日志</a>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white/90">公司</h4>
              <a href="#about" className="block text-white/50 text-sm py-1.5 transition-colors hover:text-white">关于我们</a>
              <a href="#" className="block text-white/50 text-sm py-1.5 transition-colors hover:text-white">加入团队</a>
              <a href="#" className="block text-white/50 text-sm py-1.5 transition-colors hover:text-white">媒体报道</a>
              <a href="#" className="block text-white/50 text-sm py-1.5 transition-colors hover:text-white">联系我们</a>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white/90">支持</h4>
              <a href="#" className="block text-white/50 text-sm py-1.5 transition-colors hover:text-white">帮助中心</a>
              <a href="#" className="block text-white/50 text-sm py-1.5 transition-colors hover:text-white">社区论坛</a>
              <a href="#" className="block text-white/50 text-sm py-1.5 transition-colors hover:text-white">API 文档</a>
              <a href="#" className="block text-white/50 text-sm py-1.5 transition-colors hover:text-white">服务状态</a>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white/90">法律</h4>
              <a href="#" className="block text-white/50 text-sm py-1.5 transition-colors hover:text-white">隐私政策</a>
              <a href="#" className="block text-white/50 text-sm py-1.5 transition-colors hover:text-white">服务条款</a>
              <a href="#" className="block text-white/50 text-sm py-1.5 transition-colors hover:text-white">Cookie 政策</a>
              <a href="#" className="block text-white/50 text-sm py-1.5 transition-colors hover:text-white">许可协议</a>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center pt-8 border-t border-white/[0.06] max-w-[1200px] mx-auto">
          <p className="text-white/30 text-[13px]">© 2024 Wanderlust. All rights reserved.</p>
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
            <span>简体中文</span>
          </div>
        </div>
      </footer>

      {/* 登录/注册弹窗 */}
      <AuthModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        defaultTab={authDefaultTab}
      />
    </div>
  );
}
