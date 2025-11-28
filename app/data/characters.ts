/**
 * 角色数据 - Mock
 */

import type { Character } from '~/types/game';

/**
 * 预设角色列表
 */
export const characters: Record<string, Character> = {
    // 系统角色
    narrator: {
        id: 'narrator',
        name: '旁白',
        type: 'narrator',
        description: '游戏的叙述者',
        sprites: {},
        color: '#888888',
    },
    player: {
        id: 'player',
        name: '旅行者',
        type: 'player',
        description: '你，一位热爱冒险的旅行者',
        sprites: {},
        color: '#4CAF50',
    },

    // 机场相关 NPC
    airport_staff: {
        id: 'airport_staff',
        name: '小云',
        type: 'npc',
        description: '机场的值机柜台工作人员，亲切友好',
        sprites: {
            neutral: 'https://placehold.co/400x600/667eea/fff?text=小云%5Cn微笑',
            happy: 'https://placehold.co/400x600/48bb78/fff?text=小云%5Cn开心',
            surprised: 'https://placehold.co/400x600/ed8936/fff?text=小云%5Cn惊讶',
        },
        defaultSprite: 'https://placehold.co/400x600/667eea/fff?text=小云',
        color: '#667eea',
    },
    security_guard: {
        id: 'security_guard',
        name: '老王',
        type: 'npc',
        description: '机场安检员，表面严肃但内心温暖',
        sprites: {
            neutral: 'https://placehold.co/400x600/2d3748/fff?text=老王%5Cn严肃',
            happy: 'https://placehold.co/400x600/38a169/fff?text=老王%5Cn微笑',
        },
        defaultSprite: 'https://placehold.co/400x600/2d3748/fff?text=老王',
        color: '#2d3748',
    },

    // 飞机上 NPC
    flight_attendant: {
        id: 'flight_attendant',
        name: '空姐小美',
        type: 'npc',
        description: '航班上的空乘人员，温柔体贴',
        sprites: {
            neutral: 'https://placehold.co/400x600/ec4899/fff?text=小美%5Cn微笑',
            happy: 'https://placehold.co/400x600/f472b6/fff?text=小美%5Cn开心',
            thinking: 'https://placehold.co/400x600/db2777/fff?text=小美%5Cn思考',
        },
        defaultSprite: 'https://placehold.co/400x600/ec4899/fff?text=小美',
        color: '#ec4899',
    },
    seat_neighbor: {
        id: 'seat_neighbor',
        name: '阿明',
        type: 'npc',
        description: '你在飞机上的邻座，是个有趣的旅行家',
        sprites: {
            neutral: 'https://placehold.co/400x600/3b82f6/fff?text=阿明%5Cn微笑',
            happy: 'https://placehold.co/400x600/60a5fa/fff?text=阿明%5Cn大笑',
            excited: 'https://placehold.co/400x600/2563eb/fff?text=阿明%5Cn兴奋',
            thinking: 'https://placehold.co/400x600/1d4ed8/fff?text=阿明%5Cn思考',
        },
        defaultSprite: 'https://placehold.co/400x600/3b82f6/fff?text=阿明',
        color: '#3b82f6',
    },

    // 目的地 NPC - 星月岛
    island_elder: {
        id: 'island_elder',
        name: '月婆婆',
        type: 'npc',
        description: '星月岛上的长者，了解岛上所有的秘密',
        sprites: {
            neutral: 'https://placehold.co/400x600/8b5cf6/fff?text=月婆婆%5Cn慈祥',
            happy: 'https://placehold.co/400x600/a78bfa/fff?text=月婆婆%5Cn微笑',
            thinking: 'https://placehold.co/400x600/7c3aed/fff?text=月婆婆%5Cn回忆',
        },
        defaultSprite: 'https://placehold.co/400x600/8b5cf6/fff?text=月婆婆',
        color: '#8b5cf6',
    },
    island_guide: {
        id: 'island_guide',
        name: '阿星',
        type: 'npc',
        description: '年轻的岛上导游，热情洋溢',
        sprites: {
            neutral: 'https://placehold.co/400x600/f59e0b/fff?text=阿星%5Cn微笑',
            happy: 'https://placehold.co/400x600/fbbf24/fff?text=阿星%5Cn开心',
            excited: 'https://placehold.co/400x600/d97706/fff?text=阿星%5Cn兴奋',
            surprised: 'https://placehold.co/400x600/b45309/fff?text=阿星%5Cn惊讶',
        },
        defaultSprite: 'https://placehold.co/400x600/f59e0b/fff?text=阿星',
        color: '#f59e0b',
    },
    shop_owner: {
        id: 'shop_owner',
        name: '云掌柜',
        type: 'npc',
        description: '云端集市的商铺老板，精明但不失诚信',
        sprites: {
            neutral: 'https://placehold.co/400x600/10b981/fff?text=云掌柜%5Cn微笑',
            happy: 'https://placehold.co/400x600/34d399/fff?text=云掌柜%5Cn满意',
            thinking: 'https://placehold.co/400x600/059669/fff?text=云掌柜%5Cn思考',
        },
        defaultSprite: 'https://placehold.co/400x600/10b981/fff?text=云掌柜',
        color: '#10b981',
    },
};

/**
 * 根据 ID 获取角色
 */
export function getCharacterById(id: string): Character | undefined {
    return characters[id];
}

/**
 * 获取所有 NPC 角色
 */
export function getAllNPCs(): Character[] {
    return Object.values(characters).filter(c => c.type === 'npc');
}
