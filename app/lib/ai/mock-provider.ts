/**
 * Mock AI 内容提供者
 * 
 * 使用固定数据模拟 AI 生成内容
 * 用于开发和测试阶段
 */

import type {
    Destination,
    Character,
    Scene,
    DialogNode,
    Memory,
    GamePhase
} from '~/types/game';

import type {
    IAIContentProvider,
    ScenePrompt,
    CharacterPrompt,
    DestinationPrompt,
    DialogContext,
    NPCContext,
    AIProviderConfig
} from './types';

// ============================================
// Mock 数据常量
// ============================================

/** 占位图基础 URL */
const PLACEHOLDER_BASE = 'https://placehold.co';

/** 生成占位图 URL */
function getPlaceholderImage(
    width: number,
    height: number,
    text: string,
    bgColor = '1a1a2e',
    textColor = 'eee'
): string {
    const encodedText = encodeURIComponent(text);
    return `${PLACEHOLDER_BASE}/${width}x${height}/${bgColor}/${textColor}?text=${encodedText}`;
}

/** 渐变背景样式（CSS）- 用于无网络时的降级 */
const GRADIENT_BACKGROUNDS: Record<string, string> = {
    airport: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    airplane: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    city: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    nature: 'linear-gradient(135deg, #a8e063 0%, #56ab2f 100%)',
    beach: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    mountain: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    temple: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    market: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    hotel: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    night: 'linear-gradient(135deg, #0c3483 0%, #a2b6df 100%)',
};

/** Mock 对话模板 */
const DIALOG_TEMPLATES: Record<string, string[]> = {
    greeting: [
        '欢迎来到这个神奇的地方！',
        '你好呀，旅行者！很高兴见到你！',
        '嗨！准备好开始一段奇妙的旅程了吗？',
    ],
    description: [
        '这里风景如画，让人心旷神怡。',
        '每一个角落都藏着惊喜，等待你去发现。',
        '空气中弥漫着冒险的气息。',
    ],
    farewell: [
        '期待与你再次相遇！',
        '祝你旅途愉快！',
        '带着美好的回忆离开吧！',
    ],
};

// ============================================
// Mock AI Provider 实现
// ============================================

/**
 * Mock AI 内容提供者
 */
export class MockAIProvider implements IAIContentProvider {
    private config: AIProviderConfig;

    constructor(config: AIProviderConfig = {}) {
        this.config = {
            language: 'zh-CN',
            imageStyle: 'anime',
            ...config,
        };
    }

    // ============================================
    // 图像生成（返回占位图）
    // ============================================

    async generateSceneBackground(prompt: ScenePrompt): Promise<string> {
        // 模拟 API 延迟
        await this.simulateDelay(100);

        const timeLabel = prompt.timeOfDay || '日间';
        const text = `${prompt.name}\\n${timeLabel}`;

        // 根据场景类型选择配色
        const colors = this.getSceneColors(prompt.type);

        return getPlaceholderImage(1920, 1080, text, colors.bg, colors.text);
    }

    async generateCharacterSprite(prompt: CharacterPrompt): Promise<string> {
        await this.simulateDelay(100);

        const emotionLabel = this.getEmotionLabel(prompt.emotion);
        const text = `${prompt.name}\\n${emotionLabel}`;

        return getPlaceholderImage(400, 600, text, '2d2d44', 'fff');
    }

    async generateDestinationImage(prompt: DestinationPrompt): Promise<string> {
        await this.simulateDelay(100);

        const tagsText = prompt.tags?.slice(0, 2).join(' · ') || '神秘之地';
        const text = `${prompt.name}\\n${tagsText}`;

        return getPlaceholderImage(800, 450, text, '1a1a2e', 'f0f0f0');
    }

    // ============================================
    // 文本生成
    // ============================================

    async generateDialogText(context: DialogContext): Promise<string> {
        await this.simulateDelay(50);

        // 根据主题选择模板
        const templates = DIALOG_TEMPLATES[context.topic || 'description'];
        const randomIndex = Math.floor(Math.random() * templates.length);

        return templates[randomIndex];
    }

    async generateDestinationDescription(destination: Partial<Destination>): Promise<string> {
        await this.simulateDelay(100);

        const name = destination.name || '神秘之地';
        const tags = destination.tags?.join('、') || '奇幻、神秘';

        return `${name}是一个充满${tags}气息的地方。这里的每一处风景都仿佛是画家精心描绘的杰作，等待着旅行者来探索其中的奥秘。无论是清晨的第一缕阳光，还是傍晚的最后一抹晚霞，都能让人感受到大自然的鬼斧神工。`;
    }

    async generateTravelJournal(memories: Memory[]): Promise<string> {
        await this.simulateDelay(200);

        if (memories.length === 0) {
            return '这次旅行虽然短暂，但每一刻都值得铭记。虽然没有留下太多照片，但心中的风景永远不会褪色。';
        }

        const memoryDescriptions = memories
            .map(m => `- ${m.title}: ${m.description}`)
            .join('\n');

        return `# 我的旅行日记

这次旅行收获满满！以下是我最珍贵的回忆：

${memoryDescriptions}

每一段经历都是人生中宝贵的财富。期待下一次的冒险！`;
    }

    // ============================================
    // 结构化数据生成
    // ============================================

    async generateDestination(): Promise<Destination> {
        await this.simulateDelay(200);

        const id = `dest_${Date.now()}`;

        return {
            id,
            name: '星月岛',
            subtitle: '梦幻之境',
            description: '星月岛是一个漂浮在云海之上的神秘岛屿，这里的夜空中永远闪烁着璀璨的星光，而月亮似乎触手可及。岛上居住着热情好客的岛民，他们世代守护着岛上的秘密。',
            coverImage: getPlaceholderImage(800, 450, '星月岛\\n梦幻之境', '1a1a3e', 'f0f0f0'),
            country: '云海之国',
            climate: '四季如春，微风轻拂',
            recommendedDays: 5,
            attractions: [
                {
                    id: `${id}_attr_1`,
                    name: '月光瀑布',
                    description: '传说在满月之夜，瀑布的水会发出银色的光芒',
                    image: getPlaceholderImage(600, 400, '月光瀑布', '2d2d5e', 'fff'),
                    sceneId: `${id}_scene_waterfall`,
                },
                {
                    id: `${id}_attr_2`,
                    name: '星辰花园',
                    description: '这里的花朵只在夜间绽放，每一朵都像是坠落的星星',
                    image: getPlaceholderImage(600, 400, '星辰花园', '1a3a5e', 'fff'),
                    sceneId: `${id}_scene_garden`,
                },
                {
                    id: `${id}_attr_3`,
                    name: '云端集市',
                    description: '岛民们在这里交易来自各地的奇珍异宝',
                    image: getPlaceholderImage(600, 400, '云端集市', '3d2d4e', 'fff'),
                    sceneId: `${id}_scene_market`,
                },
            ],
            tags: ['奇幻', '浪漫', '神秘', '冒险'],
        };
    }

    async generateNPC(context: NPCContext): Promise<Character> {
        await this.simulateDelay(150);

        const id = `npc_${Date.now()}`;
        const roleNames: Record<string, string> = {
            '空姐': '小云',
            '导游': '阿星',
            '当地居民': '月婆婆',
            '店主': '老张',
        };

        const name = roleNames[context.role] || '神秘人';

        return {
            id,
            name,
            type: 'npc',
            description: `${context.scene}的${context.role}，${context.personality || '友善热情'}。`,
            sprites: {
                neutral: getPlaceholderImage(400, 600, `${name}\\n平静`, '2d2d44', 'fff'),
                happy: getPlaceholderImage(400, 600, `${name}\\n开心`, '2d4d44', 'fff'),
                surprised: getPlaceholderImage(400, 600, `${name}\\n惊讶`, '4d2d44', 'fff'),
            },
            defaultSprite: getPlaceholderImage(400, 600, name, '2d2d44', 'fff'),
            color: '#FFD700',
        };
    }

    async generateScene(phase: GamePhase, name: string): Promise<Scene> {
        await this.simulateDelay(150);

        const id = `scene_${phase}_${Date.now()}`;

        return {
            id,
            phase,
            name,
            description: `${name} - 这是一个充满魅力的地方。`,
            background: getPlaceholderImage(1920, 1080, name, '1a1a2e', 'f0f0f0'),
            hotspots: [],
            entryDialogId: undefined,
        };
    }

    async generateDialogNode(context: DialogContext): Promise<DialogNode> {
        await this.simulateDelay(100);

        const text = await this.generateDialogText(context);

        return {
            id: `dialog_${Date.now()}`,
            speaker: context.speaker,
            text,
            emotion: 'neutral',
            next: null,
        };
    }

    // ============================================
    // 辅助方法
    // ============================================

    private async simulateDelay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private getSceneColors(type: string): { bg: string; text: string } {
        const colorMap: Record<string, { bg: string; text: string }> = {
            airport: { bg: '667eea', text: 'fff' },
            airplane: { bg: 'f5f7fa', text: '333' },
            city: { bg: 'ff9a9e', text: 'fff' },
            nature: { bg: '56ab2f', text: 'fff' },
            beach: { bg: '4facfe', text: 'fff' },
            mountain: { bg: '667eea', text: 'fff' },
            temple: { bg: 'f5576c', text: 'fff' },
            market: { bg: 'fcb69f', text: '333' },
            hotel: { bg: 'a18cd1', text: 'fff' },
            night: { bg: '0c3483', text: 'fff' },
        };

        return colorMap[type] || { bg: '1a1a2e', text: 'f0f0f0' };
    }

    private getEmotionLabel(emotion: string): string {
        const labels: Record<string, string> = {
            neutral: '平静',
            happy: '开心',
            sad: '悲伤',
            surprised: '惊讶',
            angry: '生气',
            thinking: '思考',
            excited: '兴奋',
        };

        return labels[emotion] || '平静';
    }
}
