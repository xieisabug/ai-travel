/**
 * 对话框组件 - Galgame 风格
 */

import { useEffect } from 'react';
import type { DialogNode, CharacterEmotion } from '~/types/game';
import { useTypewriter } from '~/hooks/useTypewriter';
import { getCharacterById } from '~/data/characters';

interface DialogBoxProps {
    /** 当前对话节点 */
    node: DialogNode;
    /** 是否已完成打字机效果 */
    isComplete: boolean;
    /** 点击继续回调 */
    onAdvance: () => void;
    /** 打字机完成回调 */
    onTypewriterComplete: () => void;
    /** 打字机速度 */
    typewriterSpeed?: number;
}

/**
 * 获取说话者信息
 */
function getSpeakerInfo(speakerId: string): { name: string; color: string } {
    if (speakerId === 'narrator') {
        return { name: '', color: '#888888' };
    }
    if (speakerId === 'player') {
        return { name: '我', color: '#4CAF50' };
    }

    const character = getCharacterById(speakerId);
    if (character) {
        return { name: character.name, color: character.color || '#FFFFFF' };
    }

    return { name: speakerId, color: '#FFFFFF' };
}

/**
 * 对话框组件
 */
export function DialogBox({
    node,
    isComplete: externalComplete,
    onAdvance,
    onTypewriterComplete,
    typewriterSpeed = 30,
}: DialogBoxProps) {
    const { displayText, isComplete: typewriterComplete, complete } = useTypewriter(
        node.text,
        {
            speed: typewriterSpeed,
            onComplete: onTypewriterComplete,
        }
    );

    const speaker = getSpeakerInfo(node.speaker);
    const isNarrator = node.speaker === 'narrator';

    // 同步外部完成状态
    useEffect(() => {
        if (externalComplete && !typewriterComplete) {
            complete();
        }
    }, [externalComplete, typewriterComplete, complete]);

    // 处理点击
    const handleClick = () => {
        if (!typewriterComplete) {
            // 如果打字机还没完成，先完成打字机
            complete();
        } else if (!node.choices?.length) {
            // 如果没有选项，推进对话
            onAdvance();
        }
        // 如果有选项，等待选择（不做任何事）
    };

    // 处理键盘事件
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleClick();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [typewriterComplete, node.choices]);

    return (
        <div
            className="absolute bottom-0 left-0 right-0 z-30"
            onClick={handleClick}
        >
            {/* 对话框背景 */}
            <div className="relative mx-4 mb-4 rounded-lg bg-black/70 backdrop-blur-sm border border-white/20 shadow-2xl">
                {/* 说话者名称 */}
                {!isNarrator && speaker.name && (
                    <div
                        className="absolute -top-4 left-4 px-4 py-1 rounded-t-lg text-sm font-bold"
                        style={{
                            backgroundColor: speaker.color,
                            color: getContrastColor(speaker.color),
                        }}
                    >
                        {speaker.name}
                    </div>
                )}

                {/* 对话内容 */}
                <div className={`p-6 ${!isNarrator && speaker.name ? 'pt-8' : ''}`}>
                    <p className={`text-lg leading-relaxed whitespace-pre-wrap ${isNarrator ? 'text-gray-300 italic' : 'text-white'}`}>
                        {displayText}
                        {!typewriterComplete && (
                            <span className="animate-pulse ml-1">▌</span>
                        )}
                    </p>
                </div>

                {/* 继续提示 */}
                {typewriterComplete && !node.choices?.length && (
                    <div className="absolute bottom-2 right-4 text-white/50 text-sm animate-bounce">
                        点击继续 ▼
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * 根据背景色计算对比色
 */
function getContrastColor(hexColor: string): string {
    // 移除 # 前缀
    const hex = hexColor.replace('#', '');

    // 转换为 RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // 计算亮度
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
