// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks/use-auth';
import type { NPCEmotion, SpotNPC } from '~/types/world';
import { buildNPCPortraitPrompt } from '~/lib/ai/image-generate';

const NPC_EMOTIONS: NPCEmotion[] = ['neutral', 'happy', 'sad', 'surprised', 'angry', 'thinking'];

export default function AdminNPCs() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();

    const [npcs, setNpcs] = useState<SpotNPC[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selectedNpc, setSelectedNpc] = useState<SpotNPC | null>(null);
    const [editNpc, setEditNpc] = useState<SpotNPC | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [page, setPage] = useState(1);

    const pageSize = 12;

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
            navigate('/');
        }
    }, [authLoading, isAuthenticated, user, navigate]);

    useEffect(() => {
        if (!authLoading && isAuthenticated && user?.role === 'admin') {
            loadNpcs();
        }
    }, [authLoading, isAuthenticated, user]);

    const loadNpcs = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch('/api/admin/npcs?limit=500&offset=0');
            const data = await response.json();
            if (!data.success) {
                setError(data.error || '加载 NPC 列表失败');
                return;
            }
            setNpcs(data.npcs || []);
        } catch (err) {
            console.error(err);
            setError('加载 NPC 列表失败');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredNpcs = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return npcs;
        return npcs.filter((npc) =>
            npc.name.toLowerCase().includes(keyword)
            || npc.role.toLowerCase().includes(keyword)
            || (npc.spotId || '').toLowerCase().includes(keyword)
            || (npc.description || '').toLowerCase().includes(keyword)
        );
    }, [npcs, search]);

    const totalPages = Math.max(1, Math.ceil(filteredNpcs.length / pageSize));
    const pageNpcs = filteredNpcs.slice((page - 1) * pageSize, page * pageSize);

    useEffect(() => {
        setPage(1);
    }, [search]);

    const openEditor = (npc: SpotNPC) => {
        setSelectedNpc(npc);
        setEditNpc(npc);
    };

    const closeEditor = () => {
        setSelectedNpc(null);
        setEditNpc(null);
    };

    const updateEditField = (field: keyof SpotNPC, value: any) => {
        if (!editNpc) return;
        setEditNpc({ ...editNpc, [field]: value });
    };

    const updateEmotionSprite = (emotion: NPCEmotion, value: string) => {
        if (!editNpc) return;
        const nextSprites = { ...(editNpc.sprites || {}) };
        if (value) {
            nextSprites[emotion] = value;
        } else {
            delete nextSprites[emotion];
        }
        setEditNpc({ ...editNpc, sprites: nextSprites });
    };

    const handleSave = async () => {
        if (!editNpc) return;
        setIsSaving(true);
        setError(null);
        try {
            const payload = {
                sprite: editNpc.sprite,
                sprites: editNpc.sprites,
                generationStatus: editNpc.generationStatus,
                name: editNpc.name,
                role: editNpc.role,
                description: editNpc.description,
                appearance: editNpc.appearance,
            };

            const response = await fetch(`/api/admin/npcs/${editNpc.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!data.success) {
                setError(data.error || '保存失败');
                return;
            }
            const updated: SpotNPC = data.npc;
            setNpcs((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
            setSelectedNpc(updated);
            setEditNpc(updated);
            setSuccessMessage('保存成功');
            setTimeout(() => setSuccessMessage(null), 2500);
        } catch (err) {
            console.error(err);
            setError('保存失败');
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white/60">加载中...</div>
        );
    }

    if (!isAuthenticated || user?.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* 顶部导航 */}
            <nav className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
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
                        <h1 className="text-xl font-bold">NPC 管理</h1>
                        <button
                            onClick={() => navigate('/admin/worlds')}
                            className="text-white/60 hover:text-white text-sm"
                        >
                            ← 返回世界列表
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadNpcs}
                            className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm"
                        >
                            刷新
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
                {(error || successMessage) && (
                    <div>
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 mb-3">
                                {error}
                                <button onClick={() => setError(null)} className="float-right">×</button>
                            </div>
                        )}
                        {successMessage && (
                            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400">
                                {successMessage}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">NPC 列表</h2>
                        <p className="text-white/50 text-sm">集中管理 NPC 资料、立绘与情绪立绘</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="搜索名称 / 角色 / 景点ID"
                            className="form-input w-72"
                        />
                        <div className="text-sm text-white/50">共 {filteredNpcs.length} 个</div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center text-white/60 py-16">加载中...</div>
                ) : filteredNpcs.length === 0 ? (
                    <div className="text-center text-white/60 py-16">暂无 NPC</div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {pageNpcs.map((npc) => (
                                <NpcCard key={npc.id} npc={npc} onEdit={() => openEditor(npc)} />
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-4">
                                <button
                                    className="px-3 py-1 rounded bg-white/5 border border-white/10 disabled:opacity-40"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    上一页
                                </button>
                                <div className="text-sm text-white/60">{page} / {totalPages}</div>
                                <button
                                    className="px-3 py-1 rounded bg-white/5 border border-white/10 disabled:opacity-40"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    下一页
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {selectedNpc && editNpc && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-neutral-900">
                            <div>
                                <div className="text-lg font-bold">编辑 NPC</div>
                                <div className="text-white/50 text-sm">{selectedNpc.name} · {selectedNpc.role}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-sm font-medium disabled:opacity-50"
                                >
                                    {isSaving ? '保存中...' : '保存'}
                                </button>
                                <button
                                    onClick={closeEditor}
                                    className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm"
                                >
                                    关闭
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="名称">
                                    <input
                                        className="form-input"
                                        value={editNpc.name}
                                        onChange={(e) => updateEditField('name', e.target.value)}
                                    />
                                </FormField>
                                <FormField label="角色">
                                    <input
                                        className="form-input"
                                        value={editNpc.role}
                                        onChange={(e) => updateEditField('role', e.target.value)}
                                    />
                                </FormField>
                                <FormField label="景点 ID" hint="引用使用，暂不支持变更">
                                    <input className="form-input" value={editNpc.spotId || ''} readOnly />
                                </FormField>
                                <FormField label="生成状态">
                                    <select
                                        className="form-input"
                                        value={editNpc.generationStatus}
                                        onChange={(e) => updateEditField('generationStatus', e.target.value)}
                                    >
                                        <option value="pending">待生成</option>
                                        <option value="generating_text">生成文本中</option>
                                        <option value="generating_sprite">生成立绘中</option>
                                        <option value="ready">已就绪</option>
                                        <option value="error">错误</option>
                                    </select>
                                </FormField>
                            </div>

                            <FormField label="简介">
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    value={editNpc.description || ''}
                                    onChange={(e) => updateEditField('description', e.target.value)}
                                />
                            </FormField>
                            <FormField label="外貌描述">
                                <textarea
                                    className="form-input"
                                    rows={2}
                                    value={editNpc.appearance || ''}
                                    onChange={(e) => updateEditField('appearance', e.target.value)}
                                />
                            </FormField>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="默认立绘" hint="对话默认立绘">
                                    <MediaInput
                                        value={editNpc.sprite || ''}
                                        onChange={(url) => updateEditField('sprite', url)}
                                        prompt={buildNPCPortraitPrompt({
                                            name: editNpc.name,
                                            role: editNpc.role,
                                            appearance: editNpc.appearance,
                                            personality: editNpc.personality || [],
                                        })}
                                    />
                                </FormField>
                                <div className="space-y-2">
                                    <div className="font-medium text-white">情绪立绘</div>
                                    <div className="text-xs text-white/50">按情绪单独上传，对话时自动匹配</div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {NPC_EMOTIONS.map((emotion) => (
                                            <MediaInput
                                                key={emotion}
                                                label={emotion}
                                                value={editNpc.sprites?.[emotion] || ''}
                                                onChange={(url) => updateEmotionSprite(emotion, url)}
                                                compact
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function NpcCard({ npc, onEdit }: { npc: SpotNPC; onEdit: () => void }) {
    const firstEmotionSprite = npc.sprites && Object.values(npc.sprites)[0];
    const displayImage = npc.sprite || firstEmotionSprite;

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                {displayImage ? (
                    <img src={displayImage} alt={npc.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">暂无立绘</div>
                )}
            </div>
            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <div className="font-semibold">{npc.name}</div>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white/60 text-xs">{npc.role}</span>
                </div>
                <div className="text-white/50 text-sm line-clamp-2">{npc.description}</div>
                <div className="text-xs text-white/40">景点: {npc.spotId || '—'}</div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                    <StatusBadge status={npc.generationStatus} />
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">{npc.id.slice(0, 8)}</span>
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <button
                    onClick={onEdit}
                    className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm"
                >
                    编辑
                </button>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: SpotNPC['generationStatus'] }) {
    const color = status === 'ready'
        ? 'bg-green-500/20 text-green-400'
        : status === 'error'
            ? 'bg-red-500/20 text-red-400'
            : 'bg-yellow-500/20 text-yellow-200';
    return (
        <span className={`px-2 py-0.5 rounded text-xs ${color}`}>{status}</span>
    );
}

function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
                <span>{label}</span>
                {hint && <span className="text-xs text-white/50">{hint}</span>}
            </div>
            {children}
        </div>
    );
}

function MediaInput({
    label,
    value,
    onChange,
    prompt,
    compact = false,
}: {
    label?: string;
    value: string;
    onChange: (url: string) => void;
    prompt?: string;
    compact?: boolean;
}) {
    const [isUploading, setIsUploading] = useState(false);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleCopyPrompt = async () => {
        if (!prompt) return;
        try {
            await navigator.clipboard.writeText(prompt);
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2000);
        } catch (err) {
            console.error(err);
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
            if (!data.success || !data.url) {
                setUploadError(data.error || '上传失败');
            } else {
                onChange(data.url);
            }
        } catch (err) {
            console.error(err);
            setUploadError('上传失败');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={`space-y-2 ${compact ? 'text-xs' : ''}`}>
            <div className="flex items-center gap-2">
                {label && <span className="text-white/80 font-medium capitalize">{label}</span>}
                {prompt && (
                    <button
                        type="button"
                        onClick={handleCopyPrompt}
                        className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/15 text-[11px]"
                        disabled={copyStatus === 'copied'}
                    >
                        {copyStatus === 'copied' ? '已复制' : '复制提示词'}
                    </button>
                )}
            </div>
            <div className="flex gap-2 items-center">
                <input
                    type="text"
                    className={`form-input ${compact ? 'text-xs py-1' : ''}`}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="输入图片 URL 或上传"
                />
                <label className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg cursor-pointer text-xs">
                    {isUploading ? '上传中...' : '上传'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
            </div>
            {uploadError && <div className="text-xs text-red-400">{uploadError}</div>}
            {value && (
                <div className={`relative ${compact ? 'w-28 h-16' : 'w-36 h-24'} rounded-lg overflow-hidden bg-white/5 border border-white/10`}>
                    <img src={value} alt={label || ''} className="w-full h-full object-cover" />
                    <button
                        onClick={() => onChange('')}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full text-white/70"
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
}
