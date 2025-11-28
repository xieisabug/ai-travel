/**
 * 目的地数据 - Mock
 */

import type { Destination } from '~/types/game';

/**
 * 预设目的地列表
 */
export const destinations: Destination[] = [
    {
        id: 'dest_starlight_island',
        name: '星月岛',
        subtitle: '梦幻之境',
        description: '星月岛是一个漂浮在云海之上的神秘岛屿。这里的夜空中永远闪烁着璀璨的星光，月亮似乎触手可及。岛上居住着热情好客的岛民，他们世代守护着岛上的秘密。传说在满月之夜，可以听到星星唱歌的声音。',
        coverImage: 'https://placehold.co/800x450/1a1a3e/f0f0f0?text=星月岛%5Cn梦幻之境',
        country: '云海之国',
        climate: '四季如春，微风轻拂',
        recommendedDays: 5,
        attractions: [
            {
                id: 'attr_moonfall',
                name: '月光瀑布',
                description: '传说在满月之夜，瀑布的水会发出银色的光芒，美得令人窒息',
                image: 'https://placehold.co/600x400/2d2d5e/fff?text=月光瀑布',
                sceneId: 'scene_moonfall',
            },
            {
                id: 'attr_stargarden',
                name: '星辰花园',
                description: '这里的花朵只在夜间绽放，每一朵都像是坠落的星星',
                image: 'https://placehold.co/600x400/1a3a5e/fff?text=星辰花园',
                sceneId: 'scene_stargarden',
            },
            {
                id: 'attr_cloudmarket',
                name: '云端集市',
                description: '岛民们在这里交易来自各地的奇珍异宝，热闹非凡',
                image: 'https://placehold.co/600x400/3d2d4e/fff?text=云端集市',
                sceneId: 'scene_cloudmarket',
            },
        ],
        tags: ['奇幻', '浪漫', '神秘', '星空'],
    },
    {
        id: 'dest_crystal_city',
        name: '水晶之城',
        subtitle: '光芒闪耀',
        description: '水晶之城是一座完全由天然水晶建成的城市。阳光穿透晶莹剔透的建筑，在城中投射出七彩斑斓的光芒。这里的居民都是技艺精湛的工匠，他们将水晶雕琢成各种精美的艺术品。',
        coverImage: 'https://placehold.co/800x450/4a90d9/ffffff?text=水晶之城%5Cn光芒闪耀',
        country: '璀璨王国',
        climate: '阳光充沛，温暖宜人',
        recommendedDays: 4,
        attractions: [
            {
                id: 'attr_rainbow_palace',
                name: '彩虹宫殿',
                description: '国王居住的宫殿，每天正午会呈现出最绚丽的彩虹',
                image: 'https://placehold.co/600x400/ff6b6b/fff?text=彩虹宫殿',
                sceneId: 'scene_rainbow_palace',
            },
            {
                id: 'attr_artisan_street',
                name: '工匠街',
                description: '汇集了城中最优秀的水晶工匠，可以观摩他们的精湛技艺',
                image: 'https://placehold.co/600x400/4ecdc4/fff?text=工匠街',
                sceneId: 'scene_artisan_street',
            },
            {
                id: 'attr_light_tower',
                name: '光之塔',
                description: '城市最高处，可以俯瞰整座水晶城的壮丽景色',
                image: 'https://placehold.co/600x400/45b7d1/fff?text=光之塔',
                sceneId: 'scene_light_tower',
            },
        ],
        tags: ['华丽', '艺术', '阳光', '手工艺'],
    },
    {
        id: 'dest_whisper_forest',
        name: '低语森林',
        subtitle: '自然之声',
        description: '低语森林是一片古老而神秘的原始森林。据说这里的树木都有生命，它们会在风中低声交谈。森林深处居住着各种奇异的生物，而精灵们则守护着森林的安宁。',
        coverImage: 'https://placehold.co/800x450/228b22/f0f0f0?text=低语森林%5Cn自然之声',
        country: '绿野大陆',
        climate: '湿润温和，薄雾缭绕',
        recommendedDays: 6,
        attractions: [
            {
                id: 'attr_ancient_tree',
                name: '千年古树',
                description: '据说这棵树已经活了一千年，是森林的守护者',
                image: 'https://placehold.co/600x400/2d5a27/fff?text=千年古树',
                sceneId: 'scene_ancient_tree',
            },
            {
                id: 'attr_fairy_lake',
                name: '精灵湖',
                description: '传说精灵们常在这里嬉戏，湖水清澈见底',
                image: 'https://placehold.co/600x400/20b2aa/fff?text=精灵湖',
                sceneId: 'scene_fairy_lake',
            },
            {
                id: 'attr_mushroom_village',
                name: '蘑菇村',
                description: '小矮人们居住的村庄，房子都是用巨大的蘑菇建成',
                image: 'https://placehold.co/600x400/da70d6/fff?text=蘑菇村',
                sceneId: 'scene_mushroom_village',
            },
        ],
        tags: ['自然', '神秘', '精灵', '探险'],
    },
];

/**
 * 根据 ID 获取目的地
 */
export function getDestinationById(id: string): Destination | undefined {
    return destinations.find(d => d.id === id);
}

/**
 * 获取随机目的地
 */
export function getRandomDestination(): Destination {
    const index = Math.floor(Math.random() * destinations.length);
    return destinations[index];
}
