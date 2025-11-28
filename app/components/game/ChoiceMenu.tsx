/**
 * 选项菜单组件 - Galgame 风格
 */

import type { DialogChoice } from '~/types/game';

interface ChoiceMenuProps {
    /** 可选的选项列表 */
    choices: DialogChoice[];
    /** 选择回调 */
    onChoice: (choiceId: string) => void;
    /** 是否禁用（如打字机未完成） */
    disabled?: boolean;
}

/**
 * 选项菜单组件
 */
export function ChoiceMenu({ choices, onChoice, disabled = false }: ChoiceMenuProps) {
    if (!choices.length) return null;

    return (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/30">
            <div className="flex flex-col gap-3 w-full max-w-lg mx-4">
                {choices.map((choice, index) => (
                    <button
                        key={choice.id}
                        onClick={() => !disabled && onChoice(choice.id)}
                        disabled={disabled}
                        className={`
              group relative w-full px-6 py-4 text-left text-lg
              bg-gradient-to-r from-purple-900/80 to-indigo-900/80
              hover:from-purple-700/90 hover:to-indigo-700/90
              border border-white/20 hover:border-white/40
              rounded-lg backdrop-blur-sm
              transform transition-all duration-200
              hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              focus:outline-none focus:ring-2 focus:ring-purple-400/50
            `}
                        style={{
                            animationDelay: `${index * 100}ms`,
                        }}
                    >
                        {/* 序号 */}
                        <span className="inline-flex items-center justify-center w-8 h-8 mr-3 text-sm font-bold text-purple-300 bg-purple-500/30 rounded-full">
                            {index + 1}
                        </span>

                        {/* 选项文本 */}
                        <span className="text-white group-hover:text-purple-100">
                            {choice.text}
                        </span>

                        {/* 悬停指示器 */}
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-purple-300">
                            ▶
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
