/**
 * 打字机效果 Hook
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTypewriterOptions {
    /** 每个字符的延迟（毫秒） */
    speed?: number;
    /** 开始延迟（毫秒） */
    startDelay?: number;
    /** 完成时的回调 */
    onComplete?: () => void;
}

interface UseTypewriterReturn {
    /** 当前显示的文本 */
    displayText: string;
    /** 是否已完成 */
    isComplete: boolean;
    /** 立即完成 */
    complete: () => void;
    /** 重置并重新开始 */
    reset: () => void;
}

/**
 * 打字机效果 Hook
 * 
 * @param text 要显示的完整文本
 * @param options 配置选项
 * 
 * @example
 * ```tsx
 * const { displayText, isComplete, complete } = useTypewriter('Hello World', { speed: 50 });
 * 
 * return (
 *   <div onClick={complete}>
 *     {displayText}
 *   </div>
 * );
 * ```
 */
export function useTypewriter(
    text: string,
    options: UseTypewriterOptions = {}
): UseTypewriterReturn {
    const { speed = 50, startDelay = 0, onComplete } = options;

    const [displayText, setDisplayText] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const currentIndexRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const completedRef = useRef(false);

    // 清理定时器
    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // 立即完成
    const complete = useCallback(() => {
        if (!completedRef.current) {
            clearTimer();
            setDisplayText(text);
            setIsComplete(true);
            completedRef.current = true;
            onComplete?.();
        }
    }, [text, clearTimer, onComplete]);

    // 重置
    const reset = useCallback(() => {
        clearTimer();
        currentIndexRef.current = 0;
        completedRef.current = false;
        setDisplayText('');
        setIsComplete(false);
    }, [clearTimer]);

    // 打字机效果
    useEffect(() => {
        // 如果文本为空，直接完成
        if (!text) {
            setDisplayText('');
            setIsComplete(true);
            completedRef.current = true;
            return;
        }

        // 重置状态
        currentIndexRef.current = 0;
        completedRef.current = false;
        setDisplayText('');
        setIsComplete(false);

        // 打字函数
        const typeNextChar = () => {
            if (currentIndexRef.current < text.length && !completedRef.current) {
                currentIndexRef.current++;
                setDisplayText(text.substring(0, currentIndexRef.current));

                if (currentIndexRef.current < text.length) {
                    timerRef.current = setTimeout(typeNextChar, speed);
                } else {
                    // 完成
                    setIsComplete(true);
                    completedRef.current = true;
                    onComplete?.();
                }
            }
        };

        // 开始打字（带延迟）
        timerRef.current = setTimeout(typeNextChar, startDelay);

        // 清理
        return () => {
            clearTimer();
        };
    }, [text, speed, startDelay, clearTimer, onComplete]);

    return {
        displayText,
        isComplete,
        complete,
        reset,
    };
}
