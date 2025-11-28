/**
 * 可交互热点层组件
 */

import type { Hotspot } from '~/types/game';

interface InteractiveLayerProps {
    /** 热点列表 */
    hotspots: Hotspot[];
    /** 点击热点回调 */
    onHotspotClick: (hotspot: Hotspot) => void;
    /** 是否显示热点（对话中可能隐藏） */
    visible?: boolean;
    /** 条件检查函数 */
    checkCondition?: (condition: string) => boolean;
}

/**
 * 热点图标映射
 */
const HOTSPOT_ICONS: Record<string, string> = {
    dialog: '💬',
    scene: '🚪',
    item: '✨',
    action: '👆',
};

/**
 * 可交互热点层组件
 * 
 * 在场景上渲染可点击的热点区域
 */
export function InteractiveLayer({
    hotspots,
    onHotspotClick,
    visible = true,
    checkCondition = () => true,
}: InteractiveLayerProps) {
    if (!visible || !hotspots.length) return null;

    // 过滤满足条件的热点
    const visibleHotspots = hotspots.filter(hotspot => {
        if (!hotspot.condition) return true;
        return checkCondition(hotspot.condition);
    });

    return (
        <div className="absolute inset-0 z-25 pointer-events-none">
            {visibleHotspots.map((hotspot) => (
                <button
                    key={hotspot.id}
                    onClick={() => onHotspotClick(hotspot)}
                    className={`
            absolute pointer-events-auto
            flex items-center justify-center
            transition-all duration-300
            group cursor-pointer
            ${hotspot.highlighted
                            ? 'animate-pulse'
                            : 'opacity-70 hover:opacity-100'
                        }
          `}
                    style={{
                        left: `${hotspot.x}%`,
                        top: `${hotspot.y}%`,
                        width: `${hotspot.width}%`,
                        height: `${hotspot.height}%`,
                    }}
                    title={hotspot.label}
                >
                    {/* 热点背景 */}
                    <div className={`
            absolute inset-0 rounded-lg border-2
            ${hotspot.highlighted
                            ? 'border-yellow-400/60 bg-yellow-400/10'
                            : 'border-white/30 bg-white/5'
                        }
            group-hover:border-yellow-400/80 group-hover:bg-yellow-400/20
            transition-all duration-200
          `} />

                    {/* 热点图标和标签 */}
                    <div className="relative flex flex-col items-center gap-1 text-white">
                        <span className="text-2xl drop-shadow-lg">
                            {hotspot.icon || HOTSPOT_ICONS[hotspot.type] || '🔍'}
                        </span>
                        <span className={`
              text-xs font-medium px-2 py-0.5 rounded-full
              bg-black/50 backdrop-blur-sm
              opacity-0 group-hover:opacity-100
              transition-opacity duration-200
              whitespace-nowrap
            `}>
                            {hotspot.label}
                        </span>
                    </div>

                    {/* 发光效果 */}
                    {hotspot.highlighted && (
                        <div className="absolute inset-0 rounded-lg bg-yellow-400/20 animate-ping" />
                    )}
                </button>
            ))}
        </div>
    );
}
