/**
 * 阶段进度指示器组件
 */

import type { GamePhase } from '~/types/game';
import { PHASE_CONFIG } from '~/types/game';

interface PhaseIndicatorProps {
    /** 当前阶段 */
    currentPhase: GamePhase;
    /** 是否显示完整版（包含名称） */
    showLabels?: boolean;
    /** 额外的 CSS 类名 */
    className?: string;
}

/**
 * 阶段图标映射
 */
const PHASE_ICONS: Record<GamePhase, string> = {
    planning: '📋',
    booking: '🎫',
    departure: '🧳',
    traveling: '✈️',
    destination: '🏝️',
    return: '🛬',
    home: '🏠',
};

/**
 * 所有阶段按顺序
 */
const PHASES: GamePhase[] = [
    'planning',
    'booking',
    'departure',
    'traveling',
    'destination',
    'return',
    'home',
];

/**
 * 阶段进度指示器组件
 */
export function PhaseIndicator({
    currentPhase,
    showLabels = false,
    className = '',
}: PhaseIndicatorProps) {
    const currentIndex = PHASES.indexOf(currentPhase);

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {PHASES.map((phase, index) => {
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                const config = PHASE_CONFIG[phase];

                return (
                    <div key={phase} className="flex items-center">
                        {/* 连接线 */}
                        {index > 0 && (
                            <div
                                className={`w-4 h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-600'
                                    }`}
                            />
                        )}

                        {/* 阶段节点 */}
                        <div
                            className={`
                relative group flex items-center justify-center
                ${showLabels ? 'flex-col' : ''}
              `}
                            title={config.name}
                        >
                            <div
                                className={`
                  flex items-center justify-center
                  w-8 h-8 rounded-full text-base
                  transition-all duration-200
                  ${isCurrent
                                        ? 'bg-blue-500 ring-2 ring-blue-300 scale-110'
                                        : isCompleted
                                            ? 'bg-green-600'
                                            : 'bg-gray-700'
                                    }
                `}
                            >
                                {PHASE_ICONS[phase]}
                            </div>

                            {/* 标签 */}
                            {showLabels && (
                                <span
                                    className={`
                    mt-1 text-xs whitespace-nowrap
                    ${isCurrent
                                            ? 'text-blue-400 font-medium'
                                            : isCompleted
                                                ? 'text-green-400'
                                                : 'text-gray-500'
                                        }
                  `}
                                >
                                    {config.name}
                                </span>
                            )}

                            {/* 悬停提示（非标签模式） */}
                            {!showLabels && (
                                <div className="
                  absolute -bottom-8 left-1/2 -translate-x-1/2
                  px-2 py-1 text-xs whitespace-nowrap
                  bg-black/80 text-white rounded
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                  pointer-events-none
                ">
                                    {config.name}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
