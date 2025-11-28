/**
 * 游戏主界面
 */

import { useState, useCallback } from 'react';
import type { Hotspot } from '~/types/game';
import { useGameState } from '~/hooks/useGameState';
import {
    SceneView,
    DialogBox,
    ChoiceMenu,
    InteractiveLayer,
    GameHUD,
} from '~/components/game';

/**
 * 游戏主界面组件
 */
export default function GameScreen() {
    const {
        state,
        save,
        engine,
        advanceDialog,
        makeChoice,
        completeTypewriter,
        dispatch,
    } = useGameState();

    const [showMenu, setShowMenu] = useState(false);
    const [showInventory, setShowInventory] = useState(false);
    const [showMemories, setShowMemories] = useState(false);

    // 处理热点点击
    const handleHotspotClick = useCallback(async (hotspot: Hotspot) => {
        switch (hotspot.type) {
            case 'dialog':
                await dispatch({ type: 'START_DIALOG', payload: hotspot.targetId });
                break;
            case 'scene':
                await dispatch({ type: 'CHANGE_SCENE', payload: hotspot.targetId });
                break;
            case 'item':
                // TODO: 处理物品拾取
                break;
            case 'action':
                // TODO: 处理特殊动作
                break;
        }
    }, [dispatch]);

    // 条件检查
    const checkCondition = useCallback((condition: string) => {
        return engine.checkCondition(condition);
    }, [engine]);

    // 如果游戏未加载，显示加载界面
    if (!state.isLoaded || !save) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
                <div className="text-center">
                    <div className="text-4xl mb-4 animate-spin">⏳</div>
                    <p>加载中...</p>
                </div>
            </div>
        );
    }

    const availableChoices = engine.getAvailableChoices();

    return (
        <div className="w-full h-screen overflow-hidden bg-gray-900">
            {/* 场景视图 */}
            <SceneView
                scene={state.currentScene}
                background={state.currentBackground}
                characterSprite={state.currentCharacterSprite}
            >
                {/* HUD */}
                <GameHUD
                    currentPhase={save.currentPhase}
                    inventoryCount={save.inventory.length}
                    memoriesCount={save.memories.length}
                    onMenuClick={() => setShowMenu(true)}
                    onInventoryClick={() => setShowInventory(true)}
                    onMemoriesClick={() => setShowMemories(true)}
                    visible={!state.showDialog || state.typewriterComplete}
                />

                {/* 可交互热点（对话时隐藏） */}
                <InteractiveLayer
                    hotspots={state.currentScene?.hotspots || []}
                    onHotspotClick={handleHotspotClick}
                    visible={!state.showDialog}
                    checkCondition={checkCondition}
                />

                {/* 对话框 */}
                {state.showDialog && state.currentDialogNode && (
                    <DialogBox
                        node={state.currentDialogNode}
                        isComplete={state.typewriterComplete}
                        onAdvance={advanceDialog}
                        onTypewriterComplete={completeTypewriter}
                    />
                )}

                {/* 选项菜单 */}
                {state.showChoices && availableChoices && availableChoices.length > 0 && (
                    <ChoiceMenu
                        choices={availableChoices}
                        onChoice={makeChoice}
                        disabled={!state.typewriterComplete}
                    />
                )}
            </SceneView>

            {/* 菜单弹窗 */}
            {showMenu && (
                <MenuModal
                    onClose={() => setShowMenu(false)}
                    onSave={() => dispatch({ type: 'SAVE_GAME' })}
                />
            )}

            {/* 背包弹窗 */}
            {showInventory && (
                <InventoryModal
                    items={save.inventory}
                    onClose={() => setShowInventory(false)}
                />
            )}

            {/* 回忆相册弹窗 */}
            {showMemories && (
                <MemoriesModal
                    memories={save.memories}
                    onClose={() => setShowMemories(false)}
                />
            )}
        </div>
    );
}

// ============================================
// 子组件
// ============================================

interface MenuModalProps {
    onClose: () => void;
    onSave: () => void;
}

function MenuModal({ onClose, onSave }: MenuModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-gray-800 rounded-xl p-6 w-80 border border-gray-600">
                <h2 className="text-xl font-bold text-white mb-6 text-center">游戏菜单</h2>

                <div className="space-y-3">
                    <button
                        onClick={() => {
                            onSave();
                            onClose();
                        }}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                    >
                        💾 保存游戏
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                    >
                        ↩️ 返回游戏
                    </button>
                </div>
            </div>
        </div>
    );
}

interface InventoryModalProps {
    items: Array<{ id: string; name: string; description: string; icon: string; quantity: number }>;
    onClose: () => void;
}

function InventoryModal({ items, onClose }: InventoryModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-gray-800 rounded-xl p-6 w-96 max-h-[80vh] border border-gray-600">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">🎒 背包</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl"
                    >
                        ×
                    </button>
                </div>

                {items.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">背包是空的</p>
                ) : (
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg"
                            >
                                <span className="text-2xl">{item.icon}</span>
                                <div className="flex-1">
                                    <div className="font-medium text-white">{item.name}</div>
                                    <div className="text-sm text-gray-400">{item.description}</div>
                                </div>
                                {item.quantity > 1 && (
                                    <span className="text-yellow-400 font-bold">×{item.quantity}</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface MemoriesModalProps {
    memories: Array<{ id: string; title: string; description: string; image: string }>;
    onClose: () => void;
}

function MemoriesModal({ memories, onClose }: MemoriesModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-gray-800 rounded-xl p-6 w-[500px] max-h-[80vh] border border-gray-600">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">📸 回忆相册</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl"
                    >
                        ×
                    </button>
                </div>

                {memories.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">还没有收集到回忆</p>
                ) : (
                    <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                        {memories.map((memory) => (
                            <div
                                key={memory.id}
                                className="relative rounded-lg overflow-hidden group cursor-pointer"
                            >
                                <img
                                    src={memory.image}
                                    alt={memory.title}
                                    className="w-full aspect-[4/3] object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                    <div className="font-medium text-white">{memory.title}</div>
                                    <div className="text-xs text-gray-300">{memory.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export function meta() {
    return [
        { title: "AI 虚拟旅行 - 游戏中" },
        { name: "description", content: "正在进行虚拟旅行..." },
    ];
}
