// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks/use-auth';
import type { World, TravelVehicle, TravelProject, Spot, SpotNPC, DialogScript, DialogScriptType, DialogLine } from '~/types/world';
import {
    buildWorldCoverPrompt,
    buildWorldOverviewPrompt,
    buildWorldOverviewPrompts,
    buildWorldCulturePrompt,
    buildWorldCulturePrompts,
    buildTravelVehiclePrompt,
    buildProjectCoverPrompt,
    buildSpotImagePrompt,
    buildNPCPortraitPrompt,
} from '~/lib/ai/image-generate';

const copyPrompt = async (text?: string) => {
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
    } catch (error) {
        console.error('复制提示词失败', error);
    }
};

// ============================================
// 类型定义
// ============================================

type EditMode = 'list' | 'world' | 'project' | 'spot';

interface EditState {
    mode: EditMode;
    worldId?: string;
    projectId?: string;
    spotId?: string;
}

// ============================================
// 管理员世界管理页面
// ============================================

export default function AdminWorlds() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();

    // 状态
    const [worlds, setWorlds] = useState<World[]>([]);
    const [selectedWorld, setSelectedWorld] = useState<World | null>(null);
    const [editState, setEditState] = useState<EditState>({ mode: 'list' });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // 权限检查
    useEffect(() => {
        if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
            navigate('/');
        }
    }, [authLoading, isAuthenticated, user, navigate]);

    // 加载世界列表 - 只在认证完成且是管理员时加载
    useEffect(() => {
        if (!authLoading && isAuthenticated && user?.role === 'admin') {
            loadWorlds();
        }
    }, [authLoading, isAuthenticated, user]);

    const loadWorlds = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/worlds');
            const data: any = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                setWorlds(data.worlds || []);
            }
        } catch (err) {
            setError('加载世界列表失败');
        } finally {
            setIsLoading(false);
        }
    };

    const loadWorldDetail = async (worldId: string) => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/worlds/${worldId}`);
            const data: any = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                // API 直接返回 world 对象
                setSelectedWorld(data);
                setEditState({ mode: 'world', worldId });
            }
        } catch (err) {
            setError('加载世界详情失败');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveWorld = async () => {
        if (!selectedWorld) return;

        try {
            setIsSaving(true);
            setError(null);
            const response = await fetch(`/api/admin/worlds/${selectedWorld.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedWorld),
            });
            const data: any = await response.json();
            if (data.success) {
                setSuccessMessage('保存成功！');
                setTimeout(() => setSuccessMessage(null), 3000);
                // 更新列表中的世界
                setWorlds(prev => prev.map(w => w.id === selectedWorld.id ? selectedWorld : w));
            } else {
                setError(data.error || '保存失败');
            }
        } catch (err) {
            setError('保存失败');
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateWorld = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // 1. 创建生成任务
            const response = await fetch('/api/worlds/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data: any = await response.json();

            if (data.error) {
                setError(data.error);
                return;
            }

            if (!data.taskId) {
                setError('生成任务创建失败');
                return;
            }

            // 2. 轮询任务状态
            const taskId = data.taskId;
            let attempts = 0;
            const maxAttempts = 120; // 最多等待 2 分钟

            const pollTask = async (): Promise<void> => {
                attempts++;
                const taskResponse = await fetch(`/api/tasks/${taskId}`);
                const taskData: any = await taskResponse.json();

                if (taskData.error) {
                    setError(taskData.error);
                    return;
                }

                if (taskData.status === 'completed' && taskData.result) {
                    // 任务完成，获取生成的世界
                    const world = taskData.result;
                    setWorlds(prev => [world, ...prev]);
                    setSelectedWorld(world);
                    setEditState({ mode: 'world', worldId: world.id });
                    setSuccessMessage('世界生成成功！');
                    setTimeout(() => setSuccessMessage(null), 3000);
                    return;
                }

                if (taskData.status === 'failed') {
                    setError(taskData.error || '生成失败');
                    return;
                }

                if (attempts >= maxAttempts) {
                    setError('生成超时，请稍后重试');
                    return;
                }

                // 继续轮询
                await new Promise(resolve => setTimeout(resolve, 1000));
                return pollTask();
            };

            await pollTask();

        } catch (err) {
            setError('生成世界失败');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteWorld = async (worldId: string) => {
        if (!confirm('确定要删除这个世界吗？此操作不可恢复。')) return;

        try {
            const response = await fetch(`/api/worlds/${worldId}`, {
                method: 'DELETE',
            });
            const data: any = await response.json();
            if (data.success) {
                setWorlds(prev => prev.filter(w => w.id !== worldId));
                if (selectedWorld?.id === worldId) {
                    setSelectedWorld(null);
                    setEditState({ mode: 'list' });
                }
                setSuccessMessage('删除成功！');
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                setError(data.error || '删除失败');
            }
        } catch (err) {
            setError('删除失败');
        }
    };

    // 更新世界字段
    const updateWorldField = (field: keyof World, value: any) => {
        if (!selectedWorld) return;
        setSelectedWorld({ ...selectedWorld, [field]: value });
    };

    // 更新旅行器字段
    const updateVehicleField = (field: keyof TravelVehicle, value: any) => {
        if (!selectedWorld?.travelVehicle) return;
        setSelectedWorld({
            ...selectedWorld,
            travelVehicle: { ...selectedWorld.travelVehicle, [field]: value },
        });
    };

    // 更新项目字段
    const updateProjectField = (projectId: string, field: keyof TravelProject, value: any) => {
        if (!selectedWorld) return;
        setSelectedWorld({
            ...selectedWorld,
            travelProjects: selectedWorld.travelProjects.map(p =>
                p.id === projectId ? { ...p, [field]: value } : p
            ),
        });
    };

    // 更新场景字段
    const updateSpotField = (projectId: string, spotId: string, field: keyof Spot, value: any) => {
        if (!selectedWorld) return;
        setSelectedWorld({
            ...selectedWorld,
            travelProjects: selectedWorld.travelProjects.map(p =>
                p.id === projectId
                    ? {
                        ...p,
                        spots: p.spots.map(s =>
                            s.id === spotId ? { ...s, [field]: value } : s
                        ),
                    }
                    : p
            ),
        });
    };

    // 如果正在检查权限
    if (authLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white/60">加载中...</div>
            </div>
        );
    }

    // 如果不是管理员
    if (!isAuthenticated || user?.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* 顶部导航 */}
            <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="text-white/60 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold">世界管理</h1>
                        {editState.mode !== 'list' && (
                            <button
                                onClick={() => {
                                    setEditState({ mode: 'list' });
                                    setSelectedWorld(null);
                                }}
                                className="text-white/60 hover:text-white text-sm"
                            >
                                ← 返回列表
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {editState.mode === 'world' && (
                            <button
                                onClick={handleSaveWorld}
                                disabled={isSaving}
                                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-sm font-medium disabled:opacity-50"
                            >
                                {isSaving ? '保存中...' : '保存更改'}
                            </button>
                        )}
                        {editState.mode === 'list' && (
                            <button
                                onClick={handleGenerateWorld}
                                disabled={isLoading}
                                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-sm font-medium disabled:opacity-50"
                            >
                                {isLoading ? '生成中...' : '生成新世界'}
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* 消息提示 */}
            {(error || successMessage) && (
                <div className="max-w-7xl mx-auto px-6 pt-4">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 mb-4">
                            {error}
                            <button onClick={() => setError(null)} className="float-right">×</button>
                        </div>
                    )}
                    {successMessage && (
                        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 mb-4">
                            {successMessage}
                        </div>
                    )}
                </div>
            )}

            {/* 主内容区 */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {isLoading && editState.mode === 'list' ? (
                    <div className="text-center text-white/60 py-20">加载中...</div>
                ) : editState.mode === 'list' ? (
                    <WorldList
                        worlds={worlds}
                        onSelectWorld={loadWorldDetail}
                        onDeleteWorld={handleDeleteWorld}
                    />
                ) : selectedWorld ? (
                    <WorldEditor
                        world={selectedWorld}
                        onUpdateWorld={updateWorldField}
                        onUpdateVehicle={updateVehicleField}
                        onUpdateProject={updateProjectField}
                        onUpdateSpot={updateSpotField}
                    />
                ) : null}
            </main>
        </div>
    );
}

// ============================================
// 世界列表组件
// ============================================

interface WorldListProps {
    worlds: World[];
    onSelectWorld: (worldId: string) => void;
    onDeleteWorld: (worldId: string) => void;
}

function WorldList({ worlds, onSelectWorld, onDeleteWorld }: WorldListProps) {
    if (worlds.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="text-white/40 text-lg mb-4">还没有任何世界</div>
                <div className="text-white/30 text-sm">点击"生成新世界"开始创建</div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {worlds.map(world => (
                <div
                    key={world.id}
                    className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all group"
                >
                    {/* 封面图 */}
                    <div className="aspect-video bg-white/5 relative">
                        {world.coverImage ? (
                            <img
                                src={world.coverImage}
                                alt={world.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-white/20">
                                暂无封面
                            </div>
                        )}
                        <div className="absolute top-2 right-2">
                            <span className={`px-2 py-1 rounded text-xs ${world.generationStatus === 'ready' || world.generationStatus === 'projects_ready'
                                    ? 'bg-green-500/20 text-green-400'
                                    : world.generationStatus === 'generating'
                                        ? 'bg-yellow-500/20 text-yellow-400'
                                        : 'bg-red-500/20 text-red-400'
                                }`}>
                                {world.generationStatus}
                            </span>
                        </div>
                    </div>

                    {/* 信息 */}
                    <div className="p-4">
                        <h3 className="font-bold text-lg mb-1">{world.name}</h3>
                        {world.subtitle && (
                            <p className="text-white/40 text-sm mb-2">{world.subtitle}</p>
                        )}
                        <p className="text-white/60 text-sm line-clamp-2 mb-4">{world.description}</p>

                        <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
                            <span>{world.travelProjects?.length || 0} 个区域</span>
                            <span>·</span>
                            <span>{new Date(world.createdAt).toLocaleDateString()}</span>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => onSelectWorld(world.id)}
                                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm transition-colors"
                            >
                                编辑
                            </button>
                            <button
                                onClick={() => onDeleteWorld(world.id)}
                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors"
                            >
                                删除
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================
// 世界编辑器组件
// ============================================

interface WorldEditorProps {
    world: World;
    onUpdateWorld: (field: keyof World, value: any) => void;
    onUpdateVehicle: (field: keyof TravelVehicle, value: any) => void;
    onUpdateProject: (projectId: string, field: keyof TravelProject, value: any) => void;
    onUpdateSpot: (projectId: string, spotId: string, field: keyof Spot, value: any) => void;
}

function WorldEditor({
    world,
    onUpdateWorld,
    onUpdateVehicle,
    onUpdateProject,
    onUpdateSpot,
}: WorldEditorProps) {
    const [activeSection, setActiveSection] = useState<string>('basic');
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [expandedSpots, setExpandedSpots] = useState<Set<string>>(new Set());

    const toggleProject = (projectId: string) => {
        setExpandedProjects(prev => {
            const next = new Set(prev);
            if (next.has(projectId)) {
                next.delete(projectId);
            } else {
                next.add(projectId);
            }
            return next;
        });
    };

    const toggleSpot = (spotId: string) => {
        setExpandedSpots(prev => {
            const next = new Set(prev);
            if (next.has(spotId)) {
                next.delete(spotId);
            } else {
                next.add(spotId);
            }
            return next;
        });
    };

    const sections = [
        { id: 'basic', label: '基础信息' },
        { id: 'details', label: '风土人情' },
        { id: 'npcs', label: 'NPC 管理' },
        { id: 'vehicle', label: '旅行器' },
        { id: 'projects', label: '区域' },
    ];

    return (
        <div className="flex gap-8">
            {/* 左侧导航 */}
            <div className="w-48 shrink-0">
                <div className="sticky top-24 space-y-1">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${activeSection === section.id
                                    ? 'bg-indigo-500/20 text-indigo-400'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {section.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 右侧表单 */}
            <div className="flex-1 space-y-8">
                {/* 基础信息 */}
                {activeSection === 'basic' && (
                    <FormSection title="基础信息">
                        <FormField label="世界名称" required>
                            <input
                                type="text"
                                value={world.name}
                                onChange={(e) => onUpdateWorld('name', e.target.value)}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="副标题">
                            <input
                                type="text"
                                value={world.subtitle || ''}
                                onChange={(e) => onUpdateWorld('subtitle', e.target.value)}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="简介" required>
                            <textarea
                                value={world.description}
                                onChange={(e) => onUpdateWorld('description', e.target.value)}
                                rows={3}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="详细描述">
                            <textarea
                                value={world.detailedDescription}
                                onChange={(e) => onUpdateWorld('detailedDescription', e.target.value)}
                                rows={6}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="封面图片">
                            <MediaUpload
                                value={world.coverImage}
                                onChange={(url) => onUpdateWorld('coverImage', url)}
                                prompt={buildWorldCoverPrompt({
                                    name: world.name,
                                    description: world.description,
                                    geography: world.geography,
                                    tags: world.tags || [],
                                })}
                            />
                        </FormField>
                        <FormField label="主图">
                            <MediaUpload
                                value={world.imageUrl}
                                onChange={(url) => onUpdateWorld('imageUrl', url)}
                                prompt={buildWorldCoverPrompt({
                                    name: world.name,
                                    description: world.description,
                                    geography: world.geography,
                                    tags: world.tags || [],
                                })}
                            />
                        </FormField>
                        <FormField label="世界概况图集 (1-3 张)">
                            <div className="flex flex-wrap gap-2 mb-3 text-xs text-white/70">
                                <button
                                    type="button"
                                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15"
                                    title={(buildWorldOverviewPrompts({
                                        name: world.name,
                                        geography: world.geography,
                                        climate: world.climate,
                                        description: world.description,
                                        tags: world.tags || [],
                                        visualStyle: world.visualStyle,
                                    })[0])}
                                    onClick={() => copyPrompt(buildWorldOverviewPrompts({
                                        name: world.name,
                                        geography: world.geography,
                                        climate: world.climate,
                                        description: world.description,
                                        tags: world.tags || [],
                                        visualStyle: world.visualStyle,
                                    })[0])}
                                >
                                    复制地理/地貌 prompt
                                </button>
                                <button
                                    type="button"
                                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15"
                                    title={(buildWorldOverviewPrompts({
                                        name: world.name,
                                        geography: world.geography,
                                        climate: world.climate,
                                        description: world.description,
                                        tags: world.tags || [],
                                        visualStyle: world.visualStyle,
                                    })[1])}
                                    onClick={() => copyPrompt(buildWorldOverviewPrompts({
                                        name: world.name,
                                        geography: world.geography,
                                        climate: world.climate,
                                        description: world.description,
                                        tags: world.tags || [],
                                        visualStyle: world.visualStyle,
                                    })[1])}
                                >
                                    复制气候 prompt
                                </button>
                                <button
                                    type="button"
                                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15"
                                    title={(buildWorldOverviewPrompts({
                                        name: world.name,
                                        geography: world.geography,
                                        climate: world.climate,
                                        description: world.description,
                                        tags: world.tags || [],
                                        visualStyle: world.visualStyle,
                                    })[2])}
                                    onClick={() => copyPrompt(buildWorldOverviewPrompts({
                                        name: world.name,
                                        geography: world.geography,
                                        climate: world.climate,
                                        description: world.description,
                                        tags: world.tags || [],
                                        visualStyle: world.visualStyle,
                                    })[2])}
                                >
                                    复制地标/场景 prompt
                                </button>
                            </div>
                            <div className="space-y-3">
                                {(world.overviewImages || []).map((url, idx) => (
                                    <MediaUpload
                                        key={`overview-${idx}`}
                                        value={url}
                                        onChange={(newUrl) => {
                                            const next = [...(world.overviewImages || [])];
                                            next[idx] = newUrl;
                                            onUpdateWorld('overviewImages', next);
                                        }}
                                        prompt={buildWorldOverviewPrompt({
                                            name: world.name,
                                            geography: world.geography,
                                            climate: world.climate,
                                            description: world.description,
                                            tags: world.tags || [],
                                            visualStyle: world.visualStyle,
                                        })}
                                    />
                                ))}
                                {(world.overviewImages?.length || 0) < 3 && (
                                    <button
                                        type="button"
                                        className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 text-sm"
                                        onClick={() => onUpdateWorld('overviewImages', [...(world.overviewImages || []), ''])}
                                    >
                                        + 添加概况图片
                                    </button>
                                )}
                            </div>
                        </FormField>
                        <FormField label="特色文化图集 (1-3 张)">
                            <div className="flex flex-wrap gap-2 mb-3 text-xs text-white/70">
                                <button
                                    type="button"
                                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15"
                                    title={(buildWorldCulturePrompts({
                                        name: world.name,

                                        culture: world.culture,
                                        cuisine: world.cuisine,
                                        inhabitants: world.inhabitants,
                                        language: world.language,
                                        currency: world.currency,
                                        tags: world.tags || [],
                                        visualStyle: world.visualStyle,
                                    })[0])}
                                    onClick={() => copyPrompt(buildWorldCulturePrompts({
                                        name: world.name,
                                        culture: world.culture,
                                        cuisine: world.cuisine,
                                        inhabitants: world.inhabitants,
                                        language: world.language,
                                        currency: world.currency,
                                        tags: world.tags || [],
                                        visualStyle: world.visualStyle,
                                    })[0])}
                                >
                                    复制人文/居民 prompt
                                </button>
                                <button
                                    type="button"
                                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15"
                                    title={(buildWorldCulturePrompts({
                                        name: world.name,
                                        culture: world.culture,
                                        cuisine: world.cuisine,
                                        inhabitants: world.inhabitants,
                                        language: world.language,
                                        currency: world.currency,
                                        tags: world.tags || [],
                                        visualStyle: world.visualStyle,
                                    })[1])}
                                    onClick={() => copyPrompt(buildWorldCulturePrompts({
                                        name: world.name,
                                        culture: world.culture,
                                        cuisine: world.cuisine,
                                        inhabitants: world.inhabitants,
                                        language: world.language,
                                        currency: world.currency,
                                        tags: world.tags || [],
                                        visualStyle: world.visualStyle,
                                    })[1])}
                                >
                                    复制美食 prompt
                                </button>
                                <button
                                    type="button"
                                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15"
                                    title={(buildWorldCulturePrompts({
                                        name: world.name,
                                        culture: world.culture,
                                        cuisine: world.cuisine,
                                        inhabitants: world.inhabitants,
                                        language: world.language,
                                        currency: world.currency,
                                        tags: world.tags || [],
                                        visualStyle: world.visualStyle,
                                    })[2])}
                                    onClick={() => copyPrompt(buildWorldCulturePrompts({
                                        name: world.name,
                                        culture: world.culture,
                                        cuisine: world.cuisine,
                                        inhabitants: world.inhabitants,
                                        language: world.language,
                                        currency: world.currency,
                                        tags: world.tags || [],
                                        visualStyle: world.visualStyle,
                                    })[2])}
                                >
                                    复制语言/交易 prompt
                                </button>
                            </div>
                            <div className="space-y-3">
                                {(world.cultureImages || []).map((url, idx) => (
                                    <MediaUpload
                                        key={`culture-${idx}`}
                                        value={url}
                                        onChange={(newUrl) => {
                                            const next = [...(world.cultureImages || [])];
                                            next[idx] = newUrl;
                                            onUpdateWorld('cultureImages', next);
                                        }}
                                        prompt={buildWorldCulturePrompt({
                                            name: world.name,
                                            culture: world.culture,
                                            cuisine: world.cuisine,
                                            inhabitants: world.inhabitants,
                                            language: world.language,
                                            tags: world.tags || [],
                                            visualStyle: world.visualStyle,
                                        })}
                                    />
                                ))}
                                {(world.cultureImages?.length || 0) < 3 && (
                                    <button
                                        type="button"
                                        className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 text-sm"
                                        onClick={() => onUpdateWorld('cultureImages', [...(world.cultureImages || []), ''])}
                                    >
                                        + 添加文化图片
                                    </button>
                                )}
                            </div>
                        </FormField>
                        <FormField label="标签">
                            <TagsInput
                                value={world.tags}
                                onChange={(tags) => onUpdateWorld('tags', tags)}
                            />
                        </FormField>
                        <FormField label="生成状态">
                            <select
                                value={world.generationStatus}
                                onChange={(e) => onUpdateWorld('generationStatus', e.target.value)}
                                className="form-input"
                            >
                                <option value="generating">生成中</option>
                                <option value="ready">已就绪</option>
                                <option value="projects_ready">项目已就绪</option>
                                <option value="error">错误</option>
                            </select>
                        </FormField>
                    </FormSection>
                )}

                {/* 风土人情 */}
                {activeSection === 'details' && (
                    <FormSection title="风土人情">
                        <FormField label="地理特征">
                            <textarea
                                value={world.geography}
                                onChange={(e) => onUpdateWorld('geography', e.target.value)}
                                rows={3}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="气候特征">
                            <textarea
                                value={world.climate}
                                onChange={(e) => onUpdateWorld('climate', e.target.value)}
                                rows={3}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="文化特色">
                            <textarea
                                value={world.culture}
                                onChange={(e) => onUpdateWorld('culture', e.target.value)}
                                rows={3}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="居民特点">
                            <textarea
                                value={world.inhabitants}
                                onChange={(e) => onUpdateWorld('inhabitants', e.target.value)}
                                rows={3}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="特色美食">
                            <textarea
                                value={world.cuisine}
                                onChange={(e) => onUpdateWorld('cuisine', e.target.value)}
                                rows={3}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="语言">
                            <input
                                type="text"
                                value={world.language}
                                onChange={(e) => onUpdateWorld('language', e.target.value)}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="货币">
                            <input
                                type="text"
                                value={world.currency}
                                onChange={(e) => onUpdateWorld('currency', e.target.value)}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="特殊规则/禁忌">
                            <textarea
                                value={world.rules || ''}
                                onChange={(e) => onUpdateWorld('rules', e.target.value)}
                                rows={3}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="最佳旅游时间">
                            <input
                                type="text"
                                value={world.bestTimeToVisit || ''}
                                onChange={(e) => onUpdateWorld('bestTimeToVisit', e.target.value)}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="世界纪元/时代">
                            <input
                                type="text"
                                value={world.era || ''}
                                onChange={(e) => onUpdateWorld('era', e.target.value)}
                                className="form-input"
                            />
                        </FormField>
                    </FormSection>
                )}

                {/* NPC 管理 */}
                {activeSection === 'npcs' && (
                    <NPCSection
                        worldId={world.id}
                        npcs={world.npcs || []}
                        onNPCsChange={(npcs) => onUpdateWorld('npcs', npcs)}
                    />
                )}

                {/* 旅行器 */}
                {activeSection === 'vehicle' && world.travelVehicle && (
                    <FormSection title="旅行器">
                        <FormField label="名称" required>
                            <input
                                type="text"
                                value={world.travelVehicle.name}
                                onChange={(e) => onUpdateVehicle('name', e.target.value)}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="类型">
                            <input
                                type="text"
                                value={world.travelVehicle.type}
                                onChange={(e) => onUpdateVehicle('type', e.target.value)}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="简介">
                            <textarea
                                value={world.travelVehicle.description}
                                onChange={(e) => onUpdateVehicle('description', e.target.value)}
                                rows={3}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="详细描述">
                            <textarea
                                value={world.travelVehicle.detailedDescription}
                                onChange={(e) => onUpdateVehicle('detailedDescription', e.target.value)}
                                rows={5}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="图片">
                            <MediaUpload
                                value={world.travelVehicle.image}
                                onChange={(url) => onUpdateVehicle('image', url)}
                                prompt={buildTravelVehiclePrompt({
                                    name: world.travelVehicle.name,
                                    type: world.travelVehicle.type,
                                    appearance: world.travelVehicle.appearance,
                                    abilities: world.travelVehicle.abilities || [],
                                }, world.name)}
                            />
                        </FormField>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="载客量">
                                <input
                                    type="number"
                                    value={world.travelVehicle.capacity}
                                    onChange={(e) => onUpdateVehicle('capacity', parseInt(e.target.value))}
                                    className="form-input"
                                />
                            </FormField>
                            <FormField label="舒适度 (1-5)">
                                <input
                                    type="number"
                                    min={1}
                                    max={5}
                                    value={world.travelVehicle.comfortLevel}
                                    onChange={(e) => onUpdateVehicle('comfortLevel', parseInt(e.target.value))}
                                    className="form-input"
                                />
                            </FormField>
                        </div>
                        <FormField label="速度描述">
                            <input
                                type="text"
                                value={world.travelVehicle.speed}
                                onChange={(e) => onUpdateVehicle('speed', e.target.value)}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="外观描述">
                            <textarea
                                value={world.travelVehicle.appearance}
                                onChange={(e) => onUpdateVehicle('appearance', e.target.value)}
                                rows={3}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="内部设施">
                            <textarea
                                value={world.travelVehicle.interiorDescription}
                                onChange={(e) => onUpdateVehicle('interiorDescription', e.target.value)}
                                rows={3}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="特殊能力">
                            <TagsInput
                                value={world.travelVehicle.abilities}
                                onChange={(abilities) => onUpdateVehicle('abilities', abilities)}
                            />
                        </FormField>
                        <FormField label="生成状态">
                            <select
                                value={world.travelVehicle.generationStatus}
                                onChange={(e) => onUpdateVehicle('generationStatus', e.target.value)}
                                className="form-input"
                            >
                                <option value="pending">待生成</option>
                                <option value="generating_text">生成文本中</option>
                                <option value="generating_image">生成图片中</option>
                                <option value="ready">已就绪</option>
                                <option value="error">错误</option>
                            </select>
                        </FormField>
                    </FormSection>
                )}

                {/* 区域 */}
                {activeSection === 'projects' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">区域 ({world.travelProjects?.length || 0})</h2>
                        {world.travelProjects?.map((project, projectIndex) => (
                            <div key={project.id} className="border border-white/10 rounded-xl overflow-hidden">
                                {/* 区域标题栏 */}
                                <button
                                    onClick={() => toggleProject(project.id)}
                                    className="w-full px-6 py-4 bg-white/5 flex items-center justify-between hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-white/40">{projectIndex + 1}.</span>
                                        <span className="font-medium">{project.name}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs ${project.generationStatus === 'ready'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {project.generationStatus}
                                        </span>
                                    </div>
                                    <svg
                                        className={`w-5 h-5 text-white/40 transition-transform ${expandedProjects.has(project.id) ? 'rotate-180' : ''
                                            }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* 区域详情 */}
                                {expandedProjects.has(project.id) && (
                                    <div className="p-6 space-y-6 border-t border-white/10">
                                        {/* 区域基础信息 */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField label="区域名称">
                                                <input
                                                    type="text"
                                                    value={project.name}
                                                    onChange={(e) => onUpdateProject(project.id, 'name', e.target.value)}
                                                    className="form-input"
                                                />
                                            </FormField>
                                            <FormField label="生成状态">
                                                <select
                                                    value={project.generationStatus}
                                                    onChange={(e) => onUpdateProject(project.id, 'generationStatus', e.target.value)}
                                                    className="form-input"
                                                >
                                                    <option value="pending">待生成</option>
                                                    <option value="generating_details">生成详情中</option>
                                                    <option value="generating_images">生成图片中</option>
                                                    <option value="ready">已就绪</option>
                                                    <option value="error">错误</option>
                                                </select>
                                            </FormField>
                                        </div>
                                        <FormField label="区域描述">
                                            <textarea
                                                value={project.description}
                                                onChange={(e) => onUpdateProject(project.id, 'description', e.target.value)}
                                                rows={3}
                                                className="form-input"
                                            />
                                        </FormField>
                                        <FormField label="封面图片">
                                            <MediaUpload
                                                value={project.coverImage}
                                                onChange={(url) => onUpdateProject(project.id, 'coverImage', url)}
                                                prompt={buildProjectCoverPrompt({
                                                    name: project.name,
                                                    description: project.description,
                                                    tags: project.tags || [],
                                                }, world.name)}
                                            />
                                        </FormField>
                                        <FormField label="背景音乐（URL 或上传音频，可选）">
                                            <MediaUpload
                                                value={project.bgmUrl}
                                                onChange={(url) => onUpdateProject(project.id, 'bgmUrl', url)}
                                                accept="audio/*"
                                                placeholder="输入音乐 URL 或上传音频"
                                                uploadLabel="上传音乐"
                                                previewType="audio"
                                            />
                                        </FormField>
                                        <div className="grid grid-cols-3 gap-4">
                                            <FormField label="游玩天数">
                                                <input
                                                    type="number"
                                                    value={project.duration}
                                                    onChange={(e) => onUpdateProject(project.id, 'duration', parseInt(e.target.value))}
                                                    className="form-input"
                                                />
                                            </FormField>
                                            <FormField label="难度 (1-5)">
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={5}
                                                    value={project.difficulty}
                                                    onChange={(e) => onUpdateProject(project.id, 'difficulty', parseInt(e.target.value))}
                                                    className="form-input"
                                                />
                                            </FormField>
                                            <FormField label="适合人群">
                                                <input
                                                    type="text"
                                                    value={project.suitableFor}
                                                    onChange={(e) => onUpdateProject(project.id, 'suitableFor', e.target.value)}
                                                    className="form-input"
                                                />
                                            </FormField>
                                        </div>
                                        <FormField label="标签">
                                            <TagsInput
                                                value={project.tags}
                                                onChange={(tags) => onUpdateProject(project.id, 'tags', tags)}
                                            />
                                        </FormField>

                                        {/* 场景列表 */}
                                        <div className="pt-4 border-t border-white/10">
                                            <h4 className="font-medium mb-4">场景 ({project.spots?.length || 0})</h4>
                                            <div className="space-y-3">
                                                {project.spots?.map((spot, spotIndex) => (
                                                    <div key={spot.id} className="border border-white/10 rounded-lg overflow-hidden">
                                                        <button
                                                            onClick={() => toggleSpot(spot.id)}
                                                            className="w-full px-4 py-3 bg-white/5 flex items-center justify-between hover:bg-white/10 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-white/40 text-sm">{spotIndex + 1}.</span>
                                                                <span className="text-sm">{spot.name}</span>
                                                            </div>
                                                            <svg
                                                                className={`w-4 h-4 text-white/40 transition-transform ${expandedSpots.has(spot.id) ? 'rotate-180' : ''
                                                                    }`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>

                                                        {expandedSpots.has(spot.id) && (
                                                            <div className="p-4 space-y-4 border-t border-white/10">
                                                                <SpotEditor
                                                                    spot={spot}
                                                                    worldName={world.name}
                                                                    spotId={spot.id}
                                                                    worldNpcs={world.npcs || []}
                                                                    onUpdate={(field, value) => onUpdateSpot(project.id, spot.id, field, value)}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================
// 场景编辑器组件
// ============================================

interface SpotEditorProps {
    spot: Spot;
    worldName: string;
    spotId: string;
    worldNpcs: SpotNPC[];  // 世界级 NPC 列表，用于下拉选择
    onUpdate: (field: keyof Spot, value: any) => void;
}

function SpotEditor({ spot, worldName, spotId, worldNpcs, onUpdate }: SpotEditorProps) {
    const [expandedNpcs, setExpandedNpcs] = useState<Set<string>>(new Set());
    const [selectedNpcToAdd, setSelectedNpcToAdd] = useState<string>('');

    // 获取场景已关联的 NPC
    const linkedNpcIds = spot.npcIds || [];
    const linkedNpcs = worldNpcs.filter(npc => linkedNpcIds.includes(npc.id));
    const availableNpcs = worldNpcs.filter(npc => !linkedNpcIds.includes(npc.id));

    const toggleNpc = (npcId: string) => {
        setExpandedNpcs(prev => {
            const next = new Set(prev);
            if (next.has(npcId)) {
                next.delete(npcId);
            } else {
                next.add(npcId);
            }
            return next;
        });
    };

    const handleAddNpc = () => {
        if (!selectedNpcToAdd) return;
        const newNpcIds = [...linkedNpcIds, selectedNpcToAdd];
        onUpdate('npcIds', newNpcIds);
        setSelectedNpcToAdd('');
    };

    const handleRemoveNpc = (npcIdToRemove: string) => {
        const newNpcIds = linkedNpcIds.filter(id => id !== npcIdToRemove);
        onUpdate('npcIds', newNpcIds);
    };

    return (
        <>
            <FormField label="场景名称">
                <input
                    type="text"
                    value={spot.name}
                    onChange={(e) => onUpdate('name', e.target.value)}
                    className="form-input"
                />
            </FormField>
            <FormField label="简介">
                <textarea
                    value={spot.description}
                    onChange={(e) => onUpdate('description', e.target.value)}
                    rows={2}
                    className="form-input"
                />
            </FormField>
            <FormField label="详细描述">
                <textarea
                    value={spot.detailedDescription}
                    onChange={(e) => onUpdate('detailedDescription', e.target.value)}
                    rows={4}
                    className="form-input"
                />
            </FormField>
            <FormField label="场景图片">
                <MediaUpload
                    value={spot.image}
                    onChange={(url) => onUpdate('image', url)}
                    prompt={buildSpotImagePrompt({
                        name: spot.name,
                        description: spot.description,
                        highlights: spot.highlights || [],
                    }, worldName)}
                />
            </FormField>
            <FormField label="历史/传说">
                <textarea
                    value={spot.story}
                    onChange={(e) => onUpdate('story', e.target.value)}
                    rows={3}
                    className="form-input"
                />
            </FormField>
            <FormField label="亮点">
                <TagsInput
                    value={spot.highlights}
                    onChange={(highlights) => onUpdate('highlights', highlights)}
                />
            </FormField>
            <FormField label="参观建议">
                <textarea
                    value={spot.visitTips || ''}
                    onChange={(e) => onUpdate('visitTips', e.target.value)}
                    rows={2}
                    className="form-input"
                />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
                <FormField label="建议游览时长（分钟）">
                    <input
                        type="number"
                        value={spot.suggestedDuration}
                        onChange={(e) => onUpdate('suggestedDuration', parseInt(e.target.value))}
                        className="form-input"
                    />
                </FormField>
                <FormField label="生成状态">
                    <select
                        value={spot.generationStatus}
                        onChange={(e) => onUpdate('generationStatus', e.target.value)}
                        className="form-input"
                    >
                        <option value="pending">待生成</option>
                        <option value="generating_text">生成文本中</option>
                        <option value="generating_image">生成图片中</option>
                        <option value="ready">已就绪</option>
                        <option value="error">错误</option>
                    </select>
                </FormField>
            </div>

            {/* NPC 关联管理 */}
            <div className="pt-4 border-t border-white/10">
                <h5 className="text-sm font-medium mb-3 text-white/80">关联 NPC ({linkedNpcs.length})</h5>

                {/* 添加 NPC 下拉选择 */}
                {availableNpcs.length > 0 && (
                    <div className="flex gap-2 mb-4">
                        <select
                            value={selectedNpcToAdd}
                            onChange={(e) => setSelectedNpcToAdd(e.target.value)}
                            className="form-input flex-1"
                        >
                            <option value="">选择要关联的 NPC...</option>
                            {availableNpcs.map(npc => (
                                <option key={npc.id} value={npc.id}>
                                    {npc.name} - {npc.role}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleAddNpc}
                            disabled={!selectedNpcToAdd}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                        >
                            添加
                        </button>
                    </div>
                )}

                {worldNpcs.length === 0 && (
                    <p className="text-white/40 text-sm italic">该世界还没有创建 NPC，请先在「NPC 管理」中添加</p>
                )}

                {/* 已关联的 NPC 列表 */}
                {linkedNpcs.length > 0 ? (
                    <div className="space-y-2">
                        {linkedNpcs.map(npc => (
                            <div key={npc.id} className="border border-white/10 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleNpc(npc.id)}
                                    className="w-full px-3 py-2 bg-white/5 flex items-center justify-between hover:bg-white/10 transition-colors text-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        {npc.sprite && (
                                            <img src={npc.sprite} alt={npc.name} className="w-8 h-8 rounded-full object-cover" />
                                        )}
                                        <span>{npc.name} - {npc.role}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            onClick={(e) => { e.stopPropagation(); handleRemoveNpc(npc.id); }}
                                            className="text-red-400 hover:text-red-300 cursor-pointer text-xs"
                                        >
                                            移除
                                        </span>
                                        <svg
                                            className={`w-4 h-4 text-white/40 transition-transform ${expandedNpcs.has(npc.id) ? 'rotate-180' : ''
                                                }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>

                                {expandedNpcs.has(npc.id) && (
                                    <div className="p-3 space-y-3 border-t border-white/10">
                                        <SpotNpcDialogEditor
                                            npc={npc}
                                            spotId={spot.id}
                                            worldName={worldName}
                                            spotName={spot.name}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    worldNpcs.length > 0 && <p className="text-white/40 text-sm">尚未关联任何 NPC</p>
                )}
            </div>
        </>
    );
}

// ============================================
// NPC 编辑器组件
// ============================================

interface NpcEditorProps {
    npc: SpotNPC;
    worldName: string;
    spotName: string;
    spotId: string;
    onUpdate: (field: keyof SpotNPC, value: any) => void;
}
function NpcEditor({ npc, worldName, spotName, spotId, onUpdate }: NpcEditorProps) {
    const dialogTypes: Array<{ type: DialogScriptType; label: string }> = [
        { type: 'entry', label: '入场对话 (entry)' },
        { type: 'chat', label: '闲聊对话 (chat)' },
    ];

    const emptyScripts: Record<DialogScriptType, DialogScript | null> = {
        entry: null,
        chat: null,
        quest: null,
        shop: null,
        farewell: null,
    };

    const [dialogScripts, setDialogScripts] = useState<Record<DialogScriptType, DialogScript | null>>(emptyScripts);
    const [loadingDialogs, setLoadingDialogs] = useState(false);
    const [savingType, setSavingType] = useState<DialogScriptType | null>(null);

    const loadDialogScripts = async () => {
        try {
            setLoadingDialogs(true);
            const res = await fetch(`/api/admin/dialog-scripts?npcId=${npc.id}`);
            const data = await res.json();
            if (data.success && data.scripts) {
                const next: Record<DialogScriptType, DialogScript | null> = { ...emptyScripts };
                for (const script of data.scripts as DialogScript[]) {
                    next[script.type] = script;
                }
                setDialogScripts(next);
            }
        } finally {
            setLoadingDialogs(false);
        }
    };

    useEffect(() => {
        loadDialogScripts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [npc.id]);

    const updateScriptState = (type: DialogScriptType, updater: (prev: DialogScript | null) => DialogScript | null) => {
        setDialogScripts(prev => ({ ...prev, [type]: updater(prev[type]) }));
    };

    const handleLineChange = (type: DialogScriptType, index: number, field: keyof DialogLine, value: string) => {
        updateScriptState(type, (prev) => {
            const base: DialogScript = prev ?? {
                id: '',
                npcId: npc.id,
                spotId,
                type,
                lines: [],
                order: 0,
                isActive: true,
                createdAt: '',
                updatedAt: '',
            };
            const lines = [...base.lines];
            lines[index] = { ...lines[index], [field]: value } as DialogLine;
            return { ...base, lines };
        });
    };

    const handleAddLine = (type: DialogScriptType) => {
        updateScriptState(type, (prev) => {
            const base: DialogScript = prev ?? {
                id: '',
                npcId: npc.id,
                spotId,
                type,
                lines: [],
                order: 0,
                isActive: true,
                createdAt: '',
                updatedAt: '',
            };
            return {
                ...base,
                lines: [...(base.lines || []), { speaker: npc.name, text: '', emotion: 'neutral' }],
            };
        });
    };

    const handleRemoveLine = (type: DialogScriptType, index: number) => {
        updateScriptState(type, (prev) => {
            if (!prev) return prev;
            const lines = [...prev.lines];
            lines.splice(index, 1);
            return { ...prev, lines };
        });
    };

    const handleSave = async (type: DialogScriptType) => {
        const script = dialogScripts[type];
        if (!script || script.lines.length === 0) {
            alert('请先填写至少一行对话');
            return;
        }

        setSavingType(type);
        try {
            const hasId = Boolean(script.id);
            const payload = {
                npcId: npc.id,
                spotId,
                type,
                lines: script.lines,
                condition: script.condition,
                order: script.order || 0,
                isActive: script.isActive ?? true,
            };

            const res = await fetch(hasId ? `/api/admin/dialog-scripts/${script.id}` : '/api/admin/dialog-scripts', {
                method: hasId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(hasId ? { ...script, ...payload } : payload),
            });

            const data = await res.json();
            if (data.success) {
                const saved: DialogScript = data.script;
                setDialogScripts(prev => ({ ...prev, [type]: saved }));
            } else {
                alert(data.error || '保存失败');
            }
        } catch (err) {
            console.error('保存对话脚本失败', err);
            alert('保存对话脚本失败');
        } finally {
            setSavingType(null);
        }
    };

    return (
        <>
            <div className="grid grid-cols-2 gap-3">
                <FormField label="名称" small>
                    <input
                        type="text"
                        value={npc.name}
                        onChange={(e) => onUpdate('name', e.target.value)}
                        className="form-input"
                    />
                </FormField>
                <FormField label="角色" small>
                    <input
                        type="text"
                        value={npc.role}
                        onChange={(e) => onUpdate('role', e.target.value)}
                        className="form-input"
                    />
                </FormField>
            </div>
            <FormField label="简介" small>
                <textarea
                    value={npc.description}
                    onChange={(e) => onUpdate('description', e.target.value)}
                    rows={2}
                    className="form-input"
                />
            </FormField>
            <FormField label="背景故事" small>
                <textarea
                    value={npc.backstory}
                    onChange={(e) => onUpdate('backstory', e.target.value)}
                    rows={3}
                    className="form-input"
                />
            </FormField>
            <FormField label="外貌描述" small>
                <textarea
                    value={npc.appearance}
                    onChange={(e) => onUpdate('appearance', e.target.value)}
                    rows={2}
                    className="form-input"
                />
            </FormField>
            <FormField label="说话风格" small>
                <input
                    type="text"
                    value={npc.speakingStyle}
                    onChange={(e) => onUpdate('speakingStyle', e.target.value)}
                    className="form-input"
                />
            </FormField>
            <FormField label="性格特点" small>
                <TagsInput
                    value={npc.personality}
                    onChange={(personality) => onUpdate('personality', personality)}
                />
            </FormField>
            <FormField label="立绘图片" small>
                <MediaUpload
                    value={npc.sprite}
                    onChange={(url) => onUpdate('sprite', url)}
                    prompt={buildNPCPortraitPrompt({
                        name: npc.name,
                        role: npc.role,
                        appearance: npc.appearance,
                        personality: npc.personality || [],
                    }) + `\nWorld: ${worldName}\nSpot: ${spotName}`}
                />
            </FormField>
            <FormField label="生成状态" small>
                <select
                    value={npc.generationStatus}
                    onChange={(e) => onUpdate('generationStatus', e.target.value)}
                    className="form-input"
                >
                    <option value="pending">待生成</option>
                    <option value="generating_text">生成文本中</option>
                    <option value="generating_sprite">生成立绘中</option>
                    <option value="ready">已就绪</option>
                    <option value="error">错误</option>
                </select>
            </FormField>

            <div className="pt-3 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                    <h6 className="text-sm font-medium text-white/80">对话脚本</h6>
                    {loadingDialogs && <span className="text-xs text-white/50">加载中...</span>}
                </div>
                {dialogTypes.map(({ type, label }) => {
                    const script = dialogScripts[type];
                    return (
                        <div key={type} className="border border-white/10 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{label}</span>
                                <button
                                    onClick={() => handleAddLine(type)}
                                    className="text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20"
                                >
                                    添加行
                                </button>
                            </div>
                            {(script?.lines || []).map((line, idx) => (
                                <div key={`${type}-line-${idx}`} className="grid grid-cols-12 gap-2 items-center">
                                    <input
                                        className="form-input col-span-2"
                                        placeholder="Speaker"
                                        value={line.speaker}
                                        onChange={(e) => handleLineChange(type, idx, 'speaker', e.target.value)}
                                    />
                                    <input
                                        className="form-input col-span-8"
                                        placeholder="Text"
                                        value={line.text}
                                        onChange={(e) => handleLineChange(type, idx, 'text', e.target.value)}
                                    />
                                    <input
                                        className="form-input col-span-1"
                                        placeholder="Emotion"
                                        value={line.emotion || ''}
                                        onChange={(e) => handleLineChange(type, idx, 'emotion', e.target.value)}
                                    />
                                    <button
                                        onClick={() => handleRemoveLine(type, idx)}
                                        className="text-xs text-red-300 hover:text-red-200"
                                    >
                                        删除
                                    </button>
                                </div>
                            ))}
                            {(script?.lines?.length || 0) === 0 && (
                                <div className="text-xs text-white/50">暂无内容，点击上方“添加行”开始编辑。</div>
                            )}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <label className="text-xs text-white/60 flex items-center gap-1">
                                    顺序
                                    <input
                                        type="number"
                                        className="form-input w-20"
                                        value={script?.order ?? 0}
                                        onChange={(e) => updateScriptState(type, (prev) => prev ? { ...prev, order: parseInt(e.target.value || '0') } : prev)}
                                    />
                                </label>
                                <label className="text-xs text-white/60 flex items-center gap-1">
                                    <input
                                        type="checkbox"
                                        checked={script?.isActive ?? true}
                                        onChange={(e) => updateScriptState(type, (prev) => prev ? { ...prev, isActive: e.target.checked } : prev)}
                                    />
                                    启用
                                </label>
                                <button
                                    onClick={() => handleSave(type)}
                                    disabled={savingType === type}
                                    className="text-xs px-3 py-1 rounded bg-gradient-to-r from-indigo-500 to-purple-600 disabled:opacity-50"
                                >
                                    {savingType === type ? '保存中...' : '保存脚本'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}

// ============================================
// 场景 NPC 对话编辑器组件（仅管理对话，不编辑 NPC 属性）
// ============================================

interface SpotNpcDialogEditorProps {
    npc: SpotNPC;
    spotId: string;
    worldName: string;
    spotName: string;
}

function SpotNpcDialogEditor({ npc, spotId, worldName, spotName }: SpotNpcDialogEditorProps) {
    const dialogTypes: Array<{ type: DialogScriptType; label: string }> = [
        { type: 'entry', label: '入场对话 (entry)' },
        { type: 'chat', label: '闲聊对话 (chat)' },
    ];

    const emptyScripts: Record<DialogScriptType, DialogScript | null> = {
        entry: null,
        chat: null,
        quest: null,
        shop: null,
        farewell: null,
    };

    const [dialogScripts, setDialogScripts] = useState<Record<DialogScriptType, DialogScript | null>>(emptyScripts);
    const [loadingDialogs, setLoadingDialogs] = useState(false);
    const [savingType, setSavingType] = useState<DialogScriptType | null>(null);

    const loadDialogScripts = async () => {
        try {
            setLoadingDialogs(true);
            // 加载该 NPC 在当前场景的对话脚本
            const res = await fetch(`/api/admin/dialog-scripts?npcId=${npc.id}&spotId=${spotId}`);
            const data = await res.json();
            if (data.success && data.scripts) {
                const next: Record<DialogScriptType, DialogScript | null> = { ...emptyScripts };
                for (const script of data.scripts as DialogScript[]) {
                    next[script.type] = script;
                }
                setDialogScripts(next);
            }
        } finally {
            setLoadingDialogs(false);
        }
    };

    useEffect(() => {
        loadDialogScripts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [npc.id, spotId]);

    const updateScriptState = (type: DialogScriptType, updater: (prev: DialogScript | null) => DialogScript | null) => {
        setDialogScripts(prev => ({ ...prev, [type]: updater(prev[type]) }));
    };

    const handleLineChange = (type: DialogScriptType, index: number, field: keyof DialogLine, value: string) => {
        updateScriptState(type, (prev) => {
            const base: DialogScript = prev ?? {
                id: '',
                npcId: npc.id,
                spotId,
                type,
                lines: [],
                order: 0,
                isActive: true,
                createdAt: '',
                updatedAt: '',
            };
            const lines = [...base.lines];
            lines[index] = { ...lines[index], [field]: value } as DialogLine;
            return { ...base, lines };
        });
    };

    const handleAddLine = (type: DialogScriptType) => {
        updateScriptState(type, (prev) => {
            const base: DialogScript = prev ?? {
                id: '',
                npcId: npc.id,
                spotId,
                type,
                lines: [],
                order: 0,
                isActive: true,
                createdAt: '',
                updatedAt: '',
            };
            return {
                ...base,
                lines: [...(base.lines || []), { speaker: npc.name, text: '', emotion: 'neutral' }],
            };
        });
    };

    const handleRemoveLine = (type: DialogScriptType, index: number) => {
        updateScriptState(type, (prev) => {
            if (!prev) return prev;
            const lines = [...prev.lines];
            lines.splice(index, 1);
            return { ...prev, lines };
        });
    };

    const handleSave = async (type: DialogScriptType) => {
        const script = dialogScripts[type];
        if (!script || script.lines.length === 0) {
            alert('请先填写至少一行对话');
            return;
        }

        setSavingType(type);
        try {
            const hasId = Boolean(script.id);
            const payload = {
                npcId: npc.id,
                spotId,
                type,
                lines: script.lines,
                condition: script.condition,
                order: script.order || 0,
                isActive: script.isActive ?? true,
            };

            const res = await fetch(hasId ? `/api/admin/dialog-scripts/${script.id}` : '/api/admin/dialog-scripts', {
                method: hasId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(hasId ? { ...script, ...payload } : payload),
            });

            const data = await res.json();
            if (data.success) {
                const saved: DialogScript = data.script;
                setDialogScripts(prev => ({ ...prev, [type]: saved }));
            } else {
                alert(data.error || '保存失败');
            }
        } catch (err) {
            console.error('保存对话脚本失败', err);
            alert('保存对话脚本失败');
        } finally {
            setSavingType(null);
        }
    };

    const emotionOptions: NPCEmotion[] = ['neutral', 'happy', 'sad', 'surprised', 'angry', 'thinking'];

    return (
        <div className="space-y-4">
            {/* NPC 基本信息展示（只读） */}
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                {npc.sprite && (
                    <img src={npc.sprite} alt={npc.name} className="w-16 h-16 rounded-lg object-cover" />
                )}
                <div className="flex-1 min-w-0">
                    <div className="font-medium">{npc.name}</div>
                    <div className="text-sm text-white/60">{npc.role}</div>
                    <div className="text-xs text-white/40 mt-1 line-clamp-2">{npc.description}</div>
                </div>
            </div>

            {/* 对话脚本编辑 */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h6 className="text-sm font-medium text-white/80">对话脚本（此场景）</h6>
                    {loadingDialogs && <span className="text-xs text-white/50">加载中...</span>}
                </div>
                {dialogTypes.map(({ type, label }) => {
                    const script = dialogScripts[type];
                    return (
                        <div key={type} className="border border-white/10 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{label}</span>
                                <button
                                    onClick={() => handleAddLine(type)}
                                    className="text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20"
                                >
                                    添加行
                                </button>
                            </div>
                            {(script?.lines || []).map((line, idx) => (
                                <div key={`${type}-line-${idx}`} className="grid grid-cols-12 gap-2 items-center">
                                    <input
                                        className="form-input col-span-2"
                                        placeholder="说话者"
                                        value={line.speaker}
                                        onChange={(e) => handleLineChange(type, idx, 'speaker', e.target.value)}
                                    />
                                    <input
                                        className="form-input col-span-7"
                                        placeholder="对话内容"
                                        value={line.text}
                                        onChange={(e) => handleLineChange(type, idx, 'text', e.target.value)}
                                    />
                                    <select
                                        className="form-input col-span-2"
                                        value={line.emotion || 'neutral'}
                                        onChange={(e) => handleLineChange(type, idx, 'emotion', e.target.value)}
                                    >
                                        {emotionOptions.map(em => (
                                            <option key={em} value={em}>{em}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => handleRemoveLine(type, idx)}
                                        className="text-xs text-red-300 hover:text-red-200"
                                    >
                                        删除
                                    </button>
                                </div>
                            ))}
                            {(script?.lines?.length || 0) === 0 && (
                                <div className="text-xs text-white/50">暂无对话，点击上方"添加行"开始编辑。</div>
                            )}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <label className="text-xs text-white/60 flex items-center gap-1">
                                    顺序
                                    <input
                                        type="number"
                                        className="form-input w-20"
                                        value={script?.order ?? 0}
                                        onChange={(e) => updateScriptState(type, (prev) => prev ? { ...prev, order: parseInt(e.target.value || '0') } : prev)}
                                    />
                                </label>
                                <label className="text-xs text-white/60 flex items-center gap-1">
                                    <input
                                        type="checkbox"
                                        checked={script?.isActive ?? true}
                                        onChange={(e) => updateScriptState(type, (prev) => prev ? { ...prev, isActive: e.target.checked } : prev)}
                                    />
                                    启用
                                </label>
                                <button
                                    onClick={() => handleSave(type)}
                                    disabled={savingType === type}
                                    className="text-xs px-3 py-1 rounded bg-gradient-to-r from-indigo-500 to-purple-600 disabled:opacity-50"
                                >
                                    {savingType === type ? '保存中...' : '保存脚本'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================
// 通用表单组件
// ============================================

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6">{title}</h2>
            <div className="space-y-4">{children}</div>
        </div>
    );
}

function FormField({
    label,
    required,
    small,
    children,
}: {
    label: string;
    required?: boolean;
    small?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className={`block font-medium text-white/80 mb-1.5 ${small ? 'text-xs' : 'text-sm'}`}>
                {label}
                {required && <span className="text-red-400 ml-1">*</span>}
            </label>
            {children}
        </div>
    );
}

function MediaUpload({
    value,
    onChange,
    prompt,
    accept = 'image/*',
    placeholder = '输入图片 URL 或上传',
    uploadLabel = '上传',
    previewType = 'image',
}: {
    value?: string;
    onChange: (url: string) => void;
    prompt?: string;
    accept?: string;
    placeholder?: string;
    uploadLabel?: string;
    previewType?: 'image' | 'audio' | 'none';
}) {
    const [isUploading, setIsUploading] = useState(false);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
    const [uploadError, setUploadError] = useState<string | null>(null);

    const promptText = prompt?.trim();

    const handleCopyPrompt = async () => {
        if (!promptText) return;
        try {
            await navigator.clipboard.writeText(promptText);
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2000);
        } catch (err) {
            console.error('复制 prompt 失败:', err);
            setCopyStatus('error');
            setTimeout(() => setCopyStatus('idle'), 2000);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (!response.ok || !data.success || !data.url) {
                const message = data?.error || `上传失败（${response.status}）`;
                setUploadError(message);
            } else {
                onChange(data.url);
            }
        } catch (err) {
            console.error('上传失败:', err);
            setUploadError(err instanceof Error ? err.message : '上传失败，请稍后重试');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            {promptText && (
                <div className="flex items-start gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white/70">
                    <div className="shrink-0 pt-0.5" title="图片生成提示词">💡</div>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-white">提示词</span>
                            <button
                                type="button"
                                onClick={handleCopyPrompt}
                                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/15 text-[11px] transition-colors"
                                disabled={copyStatus === 'copied'}
                            >
                                {copyStatus === 'copied' ? '已复制' : '复制'}
                            </button>
                        </div>
                        <p
                            className="leading-relaxed text-white/70 break-words"
                            title={promptText}
                            style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }}
                        >
                            {promptText}
                        </p>
                    </div>
                </div>
            )}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="form-input flex-1"
                />
                <label className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl cursor-pointer text-sm transition-colors">
                    {isUploading ? '上传中...' : uploadLabel}
                    <input
                        type="file"
                        accept={accept}
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isUploading}
                    />
                </label>
            </div>
            {uploadError && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    {uploadError}
                </div>
            )}
            {value && (
                <div
                    className={`relative ${previewType === 'audio' ? 'w-full max-w-sm p-2' : 'w-32 h-20'} bg-white/5 rounded-lg overflow-hidden`}
                >
                    {previewType === 'audio' ? (
                        <audio src={value} controls className="w-full" />
                    ) : previewType === 'image' ? (
                        <img src={value} alt="" className="w-full h-full object-cover" />
                    ) : null}
                    <button
                        onClick={() => onChange('')}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white/60 hover:text-white"
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
}

// ============================================
// NPC 管理组件
// ============================================

interface NPCSectionProps {
    worldId: string;
    npcs: SpotNPC[];
    onNPCsChange: (npcs: SpotNPC[]) => void;
}

function NPCSection({ worldId, npcs, onNPCsChange }: NPCSectionProps) {
    const [editingNPC, setEditingNPC] = useState<SpotNPC | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showAIGenerateModal, setShowAIGenerateModal] = useState(false);
    const [aiPrompt, setAIPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateError, setGenerateError] = useState<string | null>(null);

    const handleCreateNPC = async () => {
        setIsCreating(true);
        try {
            const response = await fetch(`/api/admin/worlds/${worldId}/npcs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: '新 NPC',
                    role: '居民',
                    description: '',
                    backstory: '',
                    personality: [],
                    appearance: '',
                    speakingStyle: '',
                    generationStatus: 'pending',
                }),
            });
            const data = await response.json();
            if (data.success && data.npc) {
                onNPCsChange([...npcs, data.npc]);
                setEditingNPC(data.npc);
            }
        } catch (err) {
            console.error('创建 NPC 失败', err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleAIGenerate = async () => {
        if (!aiPrompt.trim()) {
            setGenerateError('请输入 NPC 的描述要求');
            return;
        }

        setIsGenerating(true);
        setGenerateError(null);

        try {
            const response = await fetch(`/api/admin/worlds/${worldId}/npcs/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: aiPrompt }),
            });
            const data = await response.json();
            if (data.success && data.npc) {
                onNPCsChange([...npcs, data.npc]);
                setEditingNPC(data.npc);
                setShowAIGenerateModal(false);
                setAIPrompt('');
            } else {
                setGenerateError(data.error || 'AI 生成失败');
            }
        } catch (err) {
            console.error('AI 生成 NPC 失败', err);
            setGenerateError('网络错误，请重试');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveNPC = async (npc: SpotNPC) => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/admin/npcs/${npc.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(npc),
            });
            const data = await response.json();
            if (data.success && data.npc) {
                onNPCsChange(npcs.map(n => n.id === npc.id ? data.npc : n));
                setEditingNPC(null);
            }
        } catch (err) {
            console.error('保存 NPC 失败', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteNPC = async (npcId: string) => {
        if (!confirm('确定要删除这个 NPC 吗？')) return;
        try {
            const response = await fetch(`/api/admin/npcs/${npcId}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (data.success) {
                onNPCsChange(npcs.filter(n => n.id !== npcId));
                if (editingNPC?.id === npcId) {
                    setEditingNPC(null);
                }
            }
        } catch (err) {
            console.error('删除 NPC 失败', err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">NPC 管理 ({npcs.length})</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAIGenerateModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                        <span>✨</span>
                        AI 生成
                    </button>
                    <button
                        onClick={handleCreateNPC}
                        disabled={isCreating}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                        {isCreating ? '创建中...' : '+ 手动新增'}
                    </button>
                </div>
            </div>

            {/* NPC 列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {npcs.map(npc => (
                    <div
                        key={npc.id}
                        className={`bg-white/5 border rounded-xl p-4 cursor-pointer transition-all ${editingNPC?.id === npc.id
                                ? 'border-indigo-500/50 bg-indigo-500/10'
                                : 'border-white/10 hover:border-white/20'
                            }`}
                        onClick={() => setEditingNPC(npc)}
                    >
                        <div className="flex gap-3">
                            {npc.sprite ? (
                                <img
                                    src={npc.sprite}
                                    alt={npc.name}
                                    className="w-16 h-16 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center text-white/30 text-xs">
                                    暂无
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{npc.name}</div>
                                <div className="text-sm text-white/50">{npc.role}</div>
                                <div className="text-xs text-white/40 mt-1 line-clamp-2">
                                    {npc.description || '暂无描述'}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {npcs.length === 0 && (
                <div className="text-center py-12 text-white/40">
                    <div className="text-4xl mb-2">👤</div>
                    <div>暂无 NPC，点击"新增 NPC"创建</div>
                </div>
            )}

            {/* NPC 编辑弹窗 */}
            {editingNPC && (
                <NPCEditorModal
                    npc={editingNPC}
                    onSave={handleSaveNPC}
                    onDelete={() => handleDeleteNPC(editingNPC.id)}
                    onClose={() => setEditingNPC(null)}
                    isSaving={isSaving}
                />
            )}

            {/* AI 生成弹窗 */}
            {showAIGenerateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl">
                        <div className="p-6 border-b border-white/10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <span>✨</span>
                                    AI 生成 NPC
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowAIGenerateModal(false);
                                        setAIPrompt('');
                                        setGenerateError(null);
                                    }}
                                    className="text-white/50 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">
                                    描述你想要的 NPC 角色
                                </label>
                                <textarea
                                    value={aiPrompt}
                                    onChange={(e) => setAIPrompt(e.target.value)}
                                    placeholder="例如：一个神秘的老者，是这个世界的守护者，知道很多古老的秘密..."
                                    rows={4}
                                    className="form-input w-full"
                                    disabled={isGenerating}
                                />
                                <p className="text-xs text-white/40 mt-2">
                                    AI 会根据你的描述，结合世界的背景、文化、居民特点等信息，生成一个完整的 NPC 角色。
                                </p>
                            </div>

                            {generateError && (
                                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-300">
                                    {generateError}
                                </div>
                            )}

                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    onClick={() => {
                                        setShowAIGenerateModal(false);
                                        setAIPrompt('');
                                        setGenerateError(null);
                                    }}
                                    disabled={isGenerating}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm font-medium disabled:opacity-50"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleAIGenerate}
                                    disabled={isGenerating || !aiPrompt.trim()}
                                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isGenerating ? (
                                        <>
                                            <span className="animate-spin">⏳</span>
                                            生成中...
                                        </>
                                    ) : (
                                        <>
                                            <span>✨</span>
                                            开始生成
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// NPC 编辑弹窗组件
// ============================================

interface NPCEditorModalProps {
    npc: SpotNPC;
    onSave: (npc: SpotNPC) => void;
    onDelete: () => void;
    onClose: () => void;
    isSaving: boolean;
}

function NPCEditorModal({ npc, onSave, onDelete, onClose, isSaving }: NPCEditorModalProps) {
    const [editNPC, setEditNPC] = useState<SpotNPC>({ ...npc });

    const updateField = <K extends keyof SpotNPC>(field: K, value: SpotNPC[K]) => {
        setEditNPC(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-neutral-900">
                    <div>
                        <div className="text-lg font-bold">编辑 NPC</div>
                        <div className="text-white/50 text-sm">{editNPC.name} · {editNPC.role}</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onDelete}
                            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm"
                        >
                            删除
                        </button>
                        <button
                            onClick={() => onSave(editNPC)}
                            disabled={isSaving}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                            {isSaving ? '保存中...' : '保存'}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm"
                        >
                            关闭
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="名称">
                            <input
                                type="text"
                                value={editNPC.name}
                                onChange={(e) => updateField('name', e.target.value)}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="角色">
                            <input
                                type="text"
                                value={editNPC.role}
                                onChange={(e) => updateField('role', e.target.value)}
                                className="form-input"
                            />
                        </FormField>
                    </div>

                    <FormField label="简介">
                        <textarea
                            value={editNPC.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            rows={3}
                            className="form-input"
                        />
                    </FormField>

                    <FormField label="背景故事">
                        <textarea
                            value={editNPC.backstory}
                            onChange={(e) => updateField('backstory', e.target.value)}
                            rows={4}
                            className="form-input"
                        />
                    </FormField>

                    <FormField label="外貌描述">
                        <textarea
                            value={editNPC.appearance}
                            onChange={(e) => updateField('appearance', e.target.value)}
                            rows={2}
                            className="form-input"
                        />
                    </FormField>

                    <FormField label="说话风格">
                        <input
                            type="text"
                            value={editNPC.speakingStyle}
                            onChange={(e) => updateField('speakingStyle', e.target.value)}
                            className="form-input"
                        />
                    </FormField>

                    <FormField label="性格特点">
                        <TagsInput
                            value={editNPC.personality || []}
                            onChange={(tags) => updateField('personality', tags)}
                        />
                    </FormField>

                    <FormField label="兴趣爱好">
                        <TagsInput
                            value={editNPC.interests || []}
                            onChange={(tags) => updateField('interests', tags)}
                        />
                    </FormField>

                    <FormField label="立绘">
                        <MediaUpload
                            value={editNPC.sprite}
                            onChange={(url) => updateField('sprite', url)}
                            prompt={buildNPCPortraitPrompt({
                                name: editNPC.name,
                                role: editNPC.role,
                                appearance: editNPC.appearance,
                                personality: editNPC.personality || [],
                            })}
                        />
                    </FormField>

                    <FormField label="生成状态">
                        <select
                            value={editNPC.generationStatus}
                            onChange={(e) => updateField('generationStatus', e.target.value as SpotNPC['generationStatus'])}
                            className="form-input"
                        >
                            <option value="pending">待生成</option>
                            <option value="generating_text">生成文本中</option>
                            <option value="generating_sprite">生成立绘中</option>
                            <option value="ready">已就绪</option>
                            <option value="error">错误</option>
                        </select>
                    </FormField>
                </div>
            </div>
        </div>
    );
}

function TagsInput({
    value,
    onChange,
}: {
    value: string[];
    onChange: (tags: string[]) => void;
}) {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tag = inputValue.trim();
            if (tag && !value.includes(tag)) {
                onChange([...value, tag]);
            }
            setInputValue('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="space-y-2">
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入后按回车添加"
                className="form-input"
            />
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {value.map(tag => (
                        <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg text-sm"
                        >
                            {tag}
                            <button
                                onClick={() => removeTag(tag)}
                                className="hover:text-white"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
