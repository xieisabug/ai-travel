import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks/useAuth';
import type { World, TravelVehicle, TravelProject, Spot, SpotNPC } from '~/types/world';

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
            const data = await response.json();
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
            const data = await response.json();
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
            const data = await response.json();
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
            const data = await response.json();

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
                const taskData = await taskResponse.json();

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
            const data = await response.json();
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

    // 更新景点字段
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

    // 更新 NPC 字段
    const updateNpcField = (projectId: string, spotId: string, npcId: string, field: keyof SpotNPC, value: any) => {
        if (!selectedWorld) return;
        setSelectedWorld({
            ...selectedWorld,
            travelProjects: selectedWorld.travelProjects.map(p =>
                p.id === projectId
                    ? {
                        ...p,
                        spots: p.spots.map(s =>
                            s.id === spotId
                                ? {
                                    ...s,
                                    npcs: s.npcs.map(n =>
                                        n.id === npcId ? { ...n, [field]: value } : n
                                    ),
                                }
                                : s
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
                        onUpdateNpc={updateNpcField}
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
                            <span className={`px-2 py-1 rounded text-xs ${
                                world.generationStatus === 'ready' || world.generationStatus === 'projects_ready'
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
                            <span>{world.travelProjects?.length || 0} 个项目</span>
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
    onUpdateNpc: (projectId: string, spotId: string, npcId: string, field: keyof SpotNPC, value: any) => void;
}

function WorldEditor({
    world,
    onUpdateWorld,
    onUpdateVehicle,
    onUpdateProject,
    onUpdateSpot,
    onUpdateNpc,
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
        { id: 'vehicle', label: '旅行器' },
        { id: 'projects', label: '旅游项目' },
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
                            className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                                activeSection === section.id
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
                            <ImageUpload
                                value={world.coverImage}
                                onChange={(url) => onUpdateWorld('coverImage', url)}
                            />
                        </FormField>
                        <FormField label="主图">
                            <ImageUpload
                                value={world.imageUrl}
                                onChange={(url) => onUpdateWorld('imageUrl', url)}
                            />
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
                            <ImageUpload
                                value={world.travelVehicle.image}
                                onChange={(url) => onUpdateVehicle('image', url)}
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

                {/* 旅游项目 */}
                {activeSection === 'projects' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">旅游项目 ({world.travelProjects?.length || 0})</h2>
                        {world.travelProjects?.map((project, projectIndex) => (
                            <div key={project.id} className="border border-white/10 rounded-xl overflow-hidden">
                                {/* 项目标题栏 */}
                                <button
                                    onClick={() => toggleProject(project.id)}
                                    className="w-full px-6 py-4 bg-white/5 flex items-center justify-between hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-white/40">{projectIndex + 1}.</span>
                                        <span className="font-medium">{project.name}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs ${
                                            project.generationStatus === 'ready'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                            {project.generationStatus}
                                        </span>
                                    </div>
                                    <svg
                                        className={`w-5 h-5 text-white/40 transition-transform ${
                                            expandedProjects.has(project.id) ? 'rotate-180' : ''
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* 项目详情 */}
                                {expandedProjects.has(project.id) && (
                                    <div className="p-6 space-y-6 border-t border-white/10">
                                        {/* 项目基础信息 */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField label="项目名称">
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
                                        <FormField label="项目描述">
                                            <textarea
                                                value={project.description}
                                                onChange={(e) => onUpdateProject(project.id, 'description', e.target.value)}
                                                rows={3}
                                                className="form-input"
                                            />
                                        </FormField>
                                        <FormField label="封面图片">
                                            <ImageUpload
                                                value={project.coverImage}
                                                onChange={(url) => onUpdateProject(project.id, 'coverImage', url)}
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

                                        {/* 景点列表 */}
                                        <div className="pt-4 border-t border-white/10">
                                            <h4 className="font-medium mb-4">景点 ({project.spots?.length || 0})</h4>
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
                                                                className={`w-4 h-4 text-white/40 transition-transform ${
                                                                    expandedSpots.has(spot.id) ? 'rotate-180' : ''
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
                                                                    onUpdate={(field, value) => onUpdateSpot(project.id, spot.id, field, value)}
                                                                    onUpdateNpc={(npcId, field, value) => onUpdateNpc(project.id, spot.id, npcId, field, value)}
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
// 景点编辑器组件
// ============================================

interface SpotEditorProps {
    spot: Spot;
    onUpdate: (field: keyof Spot, value: any) => void;
    onUpdateNpc: (npcId: string, field: keyof SpotNPC, value: any) => void;
}

function SpotEditor({ spot, onUpdate, onUpdateNpc }: SpotEditorProps) {
    const [expandedNpcs, setExpandedNpcs] = useState<Set<string>>(new Set());

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

    return (
        <>
            <FormField label="景点名称">
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
            <FormField label="景点图片">
                <ImageUpload
                    value={spot.image}
                    onChange={(url) => onUpdate('image', url)}
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

            {/* NPC 列表 */}
            {spot.npcs?.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                    <h5 className="text-sm font-medium mb-3 text-white/80">NPC ({spot.npcs.length})</h5>
                    <div className="space-y-2">
                        {spot.npcs.map(npc => (
                            <div key={npc.id} className="border border-white/10 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleNpc(npc.id)}
                                    className="w-full px-3 py-2 bg-white/5 flex items-center justify-between hover:bg-white/10 transition-colors text-sm"
                                >
                                    <span>{npc.name} - {npc.role}</span>
                                    <svg
                                        className={`w-4 h-4 text-white/40 transition-transform ${
                                            expandedNpcs.has(npc.id) ? 'rotate-180' : ''
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {expandedNpcs.has(npc.id) && (
                                    <div className="p-3 space-y-3 border-t border-white/10">
                                        <NpcEditor
                                            npc={npc}
                                            onUpdate={(field, value) => onUpdateNpc(npc.id, field, value)}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

// ============================================
// NPC 编辑器组件
// ============================================

interface NpcEditorProps {
    npc: SpotNPC;
    onUpdate: (field: keyof SpotNPC, value: any) => void;
}

function NpcEditor({ npc, onUpdate }: NpcEditorProps) {
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
                <ImageUpload
                    value={npc.sprite}
                    onChange={(url) => onUpdate('sprite', url)}
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
        </>
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

function ImageUpload({
    value,
    onChange,
}: {
    value?: string;
    onChange: (url: string) => void;
}) {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.success && data.url) {
                onChange(data.url);
            }
        } catch (err) {
            console.error('上传失败:', err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="输入图片 URL 或上传"
                    className="form-input flex-1"
                />
                <label className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl cursor-pointer text-sm transition-colors">
                    {isUploading ? '上传中...' : '上传'}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isUploading}
                    />
                </label>
            </div>
            {value && (
                <div className="relative w-32 h-20 bg-white/5 rounded-lg overflow-hidden">
                    <img src={value} alt="" className="w-full h-full object-cover" />
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
