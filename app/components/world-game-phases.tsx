import type { NPCPublicProfile, Spot, TravelSession } from '~/types/world';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = '正在准备您的旅程...' }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.15),transparent)] pointer-events-none" />
      <div className="text-center relative z-10">
        <div className="w-12 h-12 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/70">{message}</p>
      </div>
    </div>
  );
}

interface ErrorScreenProps {
  message: string;
  onGoHome: () => void;
}

export function ErrorScreen({ message, onGoHome }: ErrorScreenProps) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.15),transparent)] pointer-events-none" />
      <div className="text-center relative z-10">
        <h2 className="text-3xl font-bold mb-4 text-red-400">😢 出错了</h2>
        <p className="text-white/70 mb-8">{message}</p>
        <button
          className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-8 py-4 rounded-full text-base font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)]"
          onClick={onGoHome}
        >
          返回首页
        </button>
      </div>
    </div>
  );
}

interface DepartingScreenProps {
  comicImage: string;
  revealed: boolean;
  shown: boolean;
  onReveal: () => void;
}

export function DepartingScreen({ comicImage, revealed, shown, onReveal }: DepartingScreenProps) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-indigo-950/50 to-purple-900/30" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.2),transparent)] pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 text-center text-white">
        <div className="relative max-w-3xl w-full mx-auto mb-10 overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <img src={comicImage} alt="Departure comic" className="w-full h-full object-cover" />
          <div
            className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent transition-all duration-700 ease-out ${revealed ? 'h-0 opacity-0' : 'h-[68%] opacity-100'}`}
          />
          <div
            className={`absolute inset-x-0 bottom-0 bg-black/90 backdrop-blur-[2px] transition-all duration-700 ease-out ${revealed ? 'h-0 opacity-0' : 'h-[68%] opacity-100'}`}
          />
        </div>
        <button
          className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-8 py-4 absolute rounded-full text-lg font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={onReveal}
          disabled={shown}
        >
          {shown ? '准备中...' : '开始旅程'}
        </button>
      </div>
    </div>
  );
}

interface TravelingScreenProps {
  onArrive: () => void;
}

export function TravelingScreen({ onArrive }: TravelingScreenProps) {
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
          onClick={onArrive}
        >
          抵达目的地
        </button>
      </div>
    </div>
  );
}

interface ExploringScreenProps {
  spot: Spot;
  npc: NPCPublicProfile | null;
  isGeneratingDialog: boolean;
  onTalk: () => void;
  onNextSpot: () => void;
  onReturn: () => void;
}

export function ExploringScreen({ spot, npc, isGeneratingDialog, onTalk, onNextSpot, onReturn }: ExploringScreenProps) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <div
        className="absolute inset-0 bg-cover bg-center bg-gradient-to-b from-indigo-950/80 via-purple-950/60 to-black/90"
        style={{ backgroundImage: spot.image ? `url(${spot.image})` : undefined }}
      >
        {!spot.image && (
          <div className="flex flex-col items-center justify-center h-full text-8xl text-white/30">
            🏛️
            <p className="text-2xl mt-4">{spot.name}</p>
          </div>
        )}
      </div>

      <div className="absolute top-8 left-8 right-8 bg-black/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 z-20 shadow-2xl">
        <h2 className="text-indigo-400 font-bold text-xl mb-3">{spot.name}</h2>
        <p className="text-white/80 leading-relaxed">{spot.description}</p>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-3 z-20">
        {npc && (
          <button
            className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-6 py-3 rounded-xl text-base font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(102,126,234,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onTalk}
            disabled={isGeneratingDialog}
          >
            {isGeneratingDialog ? '⏳ 正在生成对话...' : `💬 与 ${npc.name} 交谈`}
          </button>
        )}
        <button
          className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-6 py-3 rounded-xl text-base font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(102,126,234,0.4)]"
          onClick={onNextSpot}
        >
          ➡️ 前往下一个场景
        </button>
        <button
          className="bg-white/10 text-white border-2 border-white/30 px-6 py-3 rounded-xl text-base font-semibold cursor-pointer transition-all hover:bg-white/15 hover:border-white/50"
          onClick={onReturn}
        >
          🏠 结束旅程返回
        </button>
      </div>

      {spot.hotspots?.map(hotspot => (
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

interface DialogScreenProps {
  backgroundImage?: string;
  npc: NPCPublicProfile;
  displayedText: string;
  isTyping: boolean;
  currentLineIndex: number;
  totalLines: number;
  speaker: string;
  emotionSprite?: string;
  onContinue: () => void;
}

export function DialogScreen({
  backgroundImage,
  npc,
  displayedText,
  isTyping,
  currentLineIndex,
  totalLines,
  speaker,
  emotionSprite,
  onContinue,
}: DialogScreenProps) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-black cursor-pointer" onClick={onContinue}>
      <div
        className="absolute inset-0 bg-cover bg-center brightness-[0.7]"
        style={{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

      <div className="absolute bottom-[200px] left-1/2 -translate-x-1/2 z-[15]">
        {emotionSprite || npc.sprite ? (
          <img src={emotionSprite || npc.sprite} alt={npc.name} className="max-h-[400px] drop-shadow-2xl" />
        ) : (
          <div className="flex flex-col items-center text-[8rem] text-white/80 drop-shadow-[0_0_20px_rgba(102,126,234,0.3)]">
            👤
            <p className="text-2xl text-white mt-2 font-semibold">{npc.name}</p>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-black/85 backdrop-blur-xl px-12 py-8 z-20 min-h-[200px] border-t-2 border-indigo-500/30">
        <div className="text-indigo-400 text-xl font-bold mb-3 drop-shadow-[0_0_10px_rgba(102,126,234,0.3)]">
          {speaker}
        </div>
        <div className="text-white text-lg leading-loose min-h-[80px] tracking-wide">
          {displayedText}
          {isTyping && <span className="animate-pulse text-indigo-400">▌</span>}
        </div>
        <div className="absolute bottom-4 right-8 text-white/50 text-sm animate-pulse">
          {isTyping ? '点击加速' : currentLineIndex < totalLines - 1 ? '点击继续' : '点击结束对话'}
        </div>
      </div>
    </div>
  );
}

interface DialogLoadingProps {
  backgroundImage?: string;
}

export function DialogLoading({ backgroundImage }: DialogLoadingProps) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <div
        className="absolute inset-0 bg-cover bg-center brightness-[0.7]"
        style={{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">正在生成对话...</p>
        </div>
      </div>
    </div>
  );
}

interface ReturningScreenProps {
  session: TravelSession | null;
  onComplete: () => void;
}

export function ReturningScreen({ session, onComplete }: ReturningScreenProps) {
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
          onClick={onComplete}
        >
          完成旅程
        </button>
      </div>
    </div>
  );
}

interface CompletedScreenProps {
  session: TravelSession | null;
  onExploreMore: () => void;
  onGoHome: () => void;
}

export function CompletedScreen({ session, onExploreMore, onGoHome }: CompletedScreenProps) {
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
            onClick={onExploreMore}
          >
            🌍 探索更多世界
          </button>
          <button
            className="bg-white/10 text-white border-2 border-white/30 px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all hover:bg-white/15 hover:border-white/50"
            onClick={onGoHome}
          >
            🏠 返回首页
          </button>
        </div>
      </div>
    </div>
  );
}

export function FallbackScreen() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-black" />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 text-center text-white">
        <p className="text-white/70">加载中...</p>
      </div>
    </div>
  );
}
