import type { Spot, NPCPublicProfile } from "~/types/world";

interface ExploringScreenProps {
    spot: Spot;
    npc: NPCPublicProfile | null;
    isGeneratingDialog: boolean;
    onTalk: () => void;
    onNextSpot: () => void;
    onReturn: () => void;
}

/**
 * 探索屏幕 - 显示当前场景和交互选项
 */
export function ExploringScreen({
    spot,
    npc,
    isGeneratingDialog,
    onTalk,
    onNextSpot,
    onReturn,
}: ExploringScreenProps) {
    return (
        <div className="min-h-screen relative overflow-hidden bg-black">
            {/* 场景背景 */}
            <SpotBackground spot={spot} />

            {/* 场景信息面板 */}
            <SpotInfoPanel spot={spot} />

            {/* 底部操作按钮 */}
            <ActionButtons
                npc={npc}
                isGeneratingDialog={isGeneratingDialog}
                onTalk={onTalk}
                onNextSpot={onNextSpot}
                onReturn={onReturn}
            />

            {/* 热点区域 */}
            <Hotspots hotspots={spot.hotspots} />
        </div>
    );
}

interface SpotBackgroundProps {
    spot: Spot;
}

function SpotBackground({ spot }: SpotBackgroundProps) {
    return (
        <div
            className="absolute inset-0 bg-cover bg-center bg-gradient-to-b from-indigo-950/80 via-purple-950/60 to-black/90"
            style={{
                backgroundImage: spot.image ? `url(${spot.image})` : undefined,
            }}
        >
            {!spot.image && (
                <div className="flex flex-col items-center justify-center h-full text-8xl text-white/30">
                    🏛️
                    <p className="text-2xl mt-4">{spot.name}</p>
                </div>
            )}
        </div>
    );
}

interface SpotInfoPanelProps {
    spot: Spot;
}

function SpotInfoPanel({ spot }: SpotInfoPanelProps) {
    return (
        <div className="absolute top-8 left-8 right-8 bg-black/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 z-20 shadow-2xl">
            <h2 className="text-indigo-400 font-bold text-xl mb-3">
                {spot.name}
            </h2>
            <p className="text-white/80 leading-relaxed">{spot.description}</p>
        </div>
    );
}

interface ActionButtonsProps {
    npc: NPCPublicProfile | null;
    isGeneratingDialog: boolean;
    onTalk: () => void;
    onNextSpot: () => void;
    onReturn: () => void;
}

function ActionButtons({
    npc,
    isGeneratingDialog,
    onTalk,
    onNextSpot,
    onReturn,
}: ActionButtonsProps) {
    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-3 z-20">
            {npc && (
                <button
                    className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-6 py-3 rounded-xl text-base font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(102,126,234,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={onTalk}
                    disabled={isGeneratingDialog}
                >
                    {isGeneratingDialog
                        ? "⏳ 正在生成对话..."
                        : `💬 与 ${npc.name} 交谈`}
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
    );
}

interface HotspotsProps {
    hotspots?: Spot['hotspots'];
}

function Hotspots({ hotspots }: HotspotsProps) {
    if (!hotspots || hotspots.length === 0) return null;

    return (
        <>
            {hotspots.map((hotspot) => (
                <div
                    key={hotspot.id}
                    className="absolute cursor-pointer z-[15] flex flex-col items-center transition-transform hover:scale-125"
                    style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                    onClick={() =>
                        alert(`探索: ${hotspot.name}\n${hotspot.description}`)
                    }
                >
                    <span className="text-3xl animate-pulse drop-shadow-[0_0_10px_rgba(102,126,234,0.5)]">
                        {hotspot.type === "photo"
                            ? "📷"
                            : hotspot.type === "dialog"
                            ? "💬"
                            : "✨"}
                    </span>
                    <span className="bg-black/80 text-white px-3 py-1.5 rounded-lg text-sm mt-1 font-medium">
                        {hotspot.name}
                    </span>
                </div>
            ))}
        </>
    );
}

export type { ExploringScreenProps };
