/**
 * 游戏状态 Hook
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import type { GameState, GameSave, CreateSaveParams } from '~/types/game';
import { GameEngine, getDefaultEngine, type GameAction } from '~/lib/game-engine';

interface UseGameStateReturn {
    /** 游戏状态 */
    state: GameState;
    /** 当前存档 */
    save: GameSave | null;
    /** 游戏引擎 */
    engine: GameEngine;
    /** 分发动作 */
    dispatch: (action: GameAction) => Promise<void>;
    /** 开始新游戏 */
    startNewGame: (params: CreateSaveParams) => Promise<void>;
    /** 加载存档 */
    loadSave: (saveId: string) => Promise<void>;
    /** 推进对话 */
    advanceDialog: () => Promise<void>;
    /** 做出选择 */
    makeChoice: (choiceId: string) => Promise<void>;
    /** 完成打字机效果 */
    completeTypewriter: () => void;
    /** 保存游戏 */
    saveGame: () => Promise<void>;
}

/**
 * 游戏状态 Hook
 * 
 * 提供游戏状态和常用操作的封装
 * 
 * @example
 * ```tsx
 * function GameScreen() {
 *   const { state, dispatch, advanceDialog } = useGameState();
 *   
 *   return (
 *     <div onClick={advanceDialog}>
 *       {state.currentDialogNode?.text}
 *     </div>
 *   );
 * }
 * ```
 */
export function useGameState(): UseGameStateReturn {
    const engine = useMemo(() => getDefaultEngine({ debug: true }), []);
    const [state, setState] = useState<GameState>(engine.getState());
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [initialized, setInitialized] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // 确保只在客户端执行
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 从 URL 参数初始化游戏
    useEffect(() => {
        // 必须在客户端挂载后才能执行
        if (!isMounted || initialized) return;

        const initGame = async () => {
            const isNew = searchParams.get('new') === 'true';
            const playerName = searchParams.get('name');
            const saveId = searchParams.get('save');

            console.log('[useGameState] Init params:', { isNew, playerName, saveId });

            try {
                if (isNew && playerName) {
                    // 开始新游戏
                    console.log('[useGameState] Starting new game for:', playerName);
                    await engine.dispatch({
                        type: 'START_NEW_GAME',
                        payload: {
                            playerName,
                        },
                    });
                    const newState = engine.getState();
                    console.log('[useGameState] New game state:', newState);
                    setState(newState);
                    setInitialized(true);
                } else if (saveId) {
                    // 加载存档
                    console.log('[useGameState] Loading save:', saveId);
                    await engine.dispatch({
                        type: 'LOAD_SAVE',
                        payload: saveId,
                    });
                    const newState = engine.getState();
                    console.log('[useGameState] Loaded save state:', newState);
                    setState(newState);
                    setInitialized(true);
                } else {
                    // 没有参数，返回主页
                    console.log('[useGameState] No params, redirecting to home');
                    navigate('/');
                    return;
                }
            } catch (error) {
                console.error('[useGameState] Init error:', error);
                navigate('/');
            }
        };

        initGame();
    }, [engine, searchParams, navigate, initialized, isMounted]);

    // 订阅状态变化
    useEffect(() => {
        // 获取 StateManager 并订阅（通过引擎获取最新状态）
        const checkState = () => {
            const newState = engine.getState();
            setState(prev => {
                // 只在状态真正改变时更新
                if (JSON.stringify(prev) !== JSON.stringify(newState)) {
                    return newState;
                }
                return prev;
            });
        };

        // 监听引擎事件来触发状态更新
        const unsubscribers = [
            engine.on('save_created', checkState),
            engine.on('save_loaded', checkState),
            engine.on('save_updated', checkState),
            engine.on('phase_changed', checkState),
            engine.on('scene_changed', checkState),
            engine.on('dialog_started', checkState),
            engine.on('dialog_advanced', checkState),
            engine.on('dialog_ended', checkState),
            engine.on('choice_made', checkState),
            engine.on('item_added', checkState),
            engine.on('item_removed', checkState),
            engine.on('memory_added', checkState),
            engine.on('achievement_unlocked', checkState),
            engine.on('flag_changed', checkState),
        ];

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [engine]);

    // 分发动作
    const dispatch = useCallback(async (action: GameAction) => {
        await engine.dispatch(action);
        setState(engine.getState());
    }, [engine]);

    // 开始新游戏
    const startNewGame = useCallback(async (params: CreateSaveParams) => {
        await dispatch({ type: 'START_NEW_GAME', payload: params });
    }, [dispatch]);

    // 加载存档
    const loadSave = useCallback(async (saveId: string) => {
        await dispatch({ type: 'LOAD_SAVE', payload: saveId });
    }, [dispatch]);

    // 推进对话
    const advanceDialog = useCallback(async () => {
        await dispatch({ type: 'ADVANCE_DIALOG' });
    }, [dispatch]);

    // 做出选择
    const makeChoice = useCallback(async (choiceId: string) => {
        await dispatch({ type: 'MAKE_CHOICE', payload: choiceId });
    }, [dispatch]);

    // 完成打字机效果
    const completeTypewriter = useCallback(() => {
        dispatch({ type: 'COMPLETE_TYPEWRITER' });
    }, [dispatch]);

    // 保存游戏
    const saveGame = useCallback(async () => {
        await dispatch({ type: 'SAVE_GAME' });
    }, [dispatch]);

    return {
        state,
        save: state.save,
        engine,
        dispatch,
        startNewGame,
        loadSave,
        advanceDialog,
        makeChoice,
        completeTypewriter,
        saveGame,
    };
}
