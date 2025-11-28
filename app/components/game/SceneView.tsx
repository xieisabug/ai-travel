/**
 * 场景视图组件
 */

import type { Scene } from '~/types/game';

interface SceneViewProps {
    /** 当前场景 */
    scene: Scene | null;
    /** 背景图 URL（可覆盖场景背景） */
    background?: string | null;
    /** 角色立绘 URL */
    characterSprite?: string | null;
    /** 子元素 */
    children?: React.ReactNode;
}

/**
 * 场景视图组件
 * 
 * 渲染游戏场景的背景和角色立绘
 */
export function SceneView({
    scene,
    background,
    characterSprite,
    children
}: SceneViewProps) {
    const bgImage = background || scene?.background;

    return (
        <div className="relative w-full h-full overflow-hidden bg-gray-900">
            {/* 背景层 */}
            {bgImage && (
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500"
                    style={{
                        backgroundImage: `url(${bgImage})`,
                    }}
                >
                    {/* 背景叠加层 - 添加轻微暗角效果 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
                </div>
            )}

            {/* 角色立绘层 */}
            {characterSprite && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[80%] z-10 transition-all duration-300">
                    <img
                        src={characterSprite}
                        alt="Character"
                        className="h-full w-auto object-contain drop-shadow-2xl"
                    />
                </div>
            )}

            {/* 内容层 */}
            <div className="relative z-20 w-full h-full">
                {children}
            </div>
        </div>
    );
}
