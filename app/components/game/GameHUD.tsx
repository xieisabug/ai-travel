/**
 * 游戏 HUD（抬头显示）组件
 */

import type { GamePhase, InventoryItem } from '~/types/game';
import { PhaseIndicator } from './PhaseIndicator';

interface GameHUDProps {
    /** 当前阶段 */
    currentPhase: GamePhase;
    /** 背包物品数量 */
    inventoryCount: number;
    /** 回忆数量 */
    memoriesCount: number;
    /** 打开菜单回调 */
    onMenuClick: () => void;
    /** 打开背包回调 */
    onInventoryClick: () => void;
    /** 打开回忆相册回调 */
    onMemoriesClick: () => void;
    /** 是否显示 */
    visible?: boolean;
}

/**
 * 游戏 HUD 组件
 */
export function GameHUD({
    currentPhase,
    inventoryCount,
    memoriesCount,
    onMenuClick,
    onInventoryClick,
    onMemoriesClick,
    visible = true,
}: GameHUDProps) {
    if (!visible) return null;

    return (
        <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
            <div className="flex items-start justify-between p-4">
                {/* 左侧：阶段进度 */}
                <div className="pointer-events-auto">
                    <PhaseIndicator currentPhase={currentPhase} />
                </div>

                {/* 右侧：快捷按钮 */}
                <div className="flex items-center gap-2 pointer-events-auto">
                    {/* 背包按钮 */}
                    <button
                        onClick={onInventoryClick}
                        className="
              relative flex items-center justify-center
              w-10 h-10 rounded-lg
              bg-black/50 backdrop-blur-sm
              border border-white/20 hover:border-white/40
              text-white hover:bg-black/70
              transition-all duration-200
            "
                        title="背包"
                    >
                        <span className="text-lg">🎒</span>
                        {inventoryCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold bg-yellow-500 text-black rounded-full">
                                {inventoryCount}
                            </span>
                        )}
                    </button>

                    {/* 回忆相册按钮 */}
                    <button
                        onClick={onMemoriesClick}
                        className="
              relative flex items-center justify-center
              w-10 h-10 rounded-lg
              bg-black/50 backdrop-blur-sm
              border border-white/20 hover:border-white/40
              text-white hover:bg-black/70
              transition-all duration-200
            "
                        title="回忆相册"
                    >
                        <span className="text-lg">📸</span>
                        {memoriesCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold bg-purple-500 text-white rounded-full">
                                {memoriesCount}
                            </span>
                        )}
                    </button>

                    {/* 菜单按钮 */}
                    <button
                        onClick={onMenuClick}
                        className="
              flex items-center justify-center
              w-10 h-10 rounded-lg
              bg-black/50 backdrop-blur-sm
              border border-white/20 hover:border-white/40
              text-white hover:bg-black/70
              transition-all duration-200
            "
                        title="菜单"
                    >
                        <span className="text-lg">☰</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
