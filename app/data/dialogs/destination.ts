/**
 * 对话数据 - Mock
 * 目的地探索阶段对话
 */

import type { DialogScript } from '~/types/game';

export const destinationDialogs: DialogScript[] = [
    {
        id: 'script_island_arrival',
        phase: 'destination',
        title: '抵达星月岛',
        startNodeId: 'dialog_island_arrival',
        nodes: [
            {
                id: 'dialog_island_arrival',
                speaker: 'narrator',
                text: '飞机降落在云端机场，走出舱门的那一刻，清新的空气扑面而来，带着淡淡的花香。',
                next: 'dialog_first_impression',
            },
            {
                id: 'dialog_first_impression',
                speaker: 'player',
                text: '这里的空气真好！感觉整个人都轻飘飘的...',
                emotion: 'happy',
                next: 'dialog_look_around',
            },
            {
                id: 'dialog_look_around',
                speaker: 'narrator',
                text: '码头上有个年轻人在向你招手，看起来像是导游。',
                next: null,
            },
        ],
    },
    {
        id: 'script_meet_guide',
        phase: 'destination',
        title: '遇见导游',
        startNodeId: 'dialog_meet_guide',
        nodes: [
            {
                id: 'dialog_meet_guide',
                speaker: 'island_guide',
                text: '欢迎来到星月岛！我是阿星，你的导游！',
                emotion: 'excited',
                next: 'dialog_guide_intro',
            },
            {
                id: 'dialog_guide_intro',
                speaker: 'island_guide',
                text: '这里就是传说中的梦幻之境！我会带你参观岛上最美的地方！',
                emotion: 'happy',
                next: 'dialog_guide_ask',
            },
            {
                id: 'dialog_guide_ask',
                speaker: 'island_guide',
                text: '你最想先去看什么？是月光瀑布、星辰花园，还是云端集市？',
                emotion: 'thinking',
                choices: [
                    {
                        id: 'choice_waterfall',
                        text: '月光瀑布！我听说它很神奇',
                        nextId: 'dialog_waterfall_choice',
                    },
                    {
                        id: 'choice_garden',
                        text: '星辰花园听起来很浪漫',
                        nextId: 'dialog_garden_choice',
                    },
                    {
                        id: 'choice_market',
                        text: '先去云端集市逛逛',
                        nextId: 'dialog_market_choice',
                    },
                ],
            },
            {
                id: 'dialog_waterfall_choice',
                speaker: 'island_guide',
                text: '好选择！月光瀑布是岛上最壮观的景点！不过现在是白天，晚上来看更美哦~',
                emotion: 'excited',
                next: 'dialog_guide_lead',
            },
            {
                id: 'dialog_garden_choice',
                speaker: 'island_guide',
                text: '星辰花园确实很美！那里的花只在夜晚绽放，我们可以先去其他地方，晚上再去！',
                emotion: 'happy',
                next: 'dialog_guide_lead',
            },
            {
                id: 'dialog_market_choice',
                speaker: 'island_guide',
                text: '云端集市！那里有很多有趣的小玩意儿，还能尝到当地美食！',
                emotion: 'happy',
                next: 'dialog_guide_lead',
            },
            {
                id: 'dialog_guide_lead',
                speaker: 'island_guide',
                text: '跟我来吧！我先带你去村庄安顿一下，然后我们就可以开始探索了！',
                emotion: 'excited',
                effects: [
                    { type: 'set_flag', payload: { key: 'met_guide', value: true } },
                ],
                next: null,
            },
        ],
    },
    {
        id: 'script_village_arrival',
        phase: 'destination',
        title: '到达村庄',
        startNodeId: 'dialog_village_arrival',
        nodes: [
            {
                id: 'dialog_village_arrival',
                speaker: 'narrator',
                text: '云端村庄宛如童话世界，房屋都建在柔软的云朵上，炊烟袅袅升起，与天空融为一体。',
                next: 'dialog_village_wonder',
            },
            {
                id: 'dialog_village_wonder',
                speaker: 'player',
                text: '太神奇了！房子真的建在云上！',
                emotion: 'surprised',
                next: 'dialog_guide_explain',
            },
            {
                id: 'dialog_guide_explain',
                speaker: 'island_guide',
                text: '是的！这是星月岛特有的云凝技术，祖先们传承了几百年。走吧，我带你四处看看！',
                emotion: 'happy',
                next: null,
            },
        ],
    },
    {
        id: 'script_visit_elder',
        phase: 'destination',
        title: '拜访月婆婆',
        startNodeId: 'dialog_visit_elder',
        nodes: [
            {
                id: 'dialog_visit_elder',
                speaker: 'narrator',
                text: '推开古朴的木门，一位慈祥的老人坐在窗边，正在编织着什么。',
                next: 'dialog_elder_greet',
            },
            {
                id: 'dialog_elder_greet',
                speaker: 'island_elder',
                text: '哦，有客人来了...进来坐吧，年轻人。',
                emotion: 'happy',
                next: 'dialog_player_bow',
            },
            {
                id: 'dialog_player_bow',
                speaker: 'player',
                text: '您好，月婆婆。我是来旅游的，听说您知道很多岛上的故事...',
                emotion: 'neutral',
                next: 'dialog_elder_story',
            },
            {
                id: 'dialog_elder_story',
                speaker: 'island_elder',
                text: '故事啊...这座岛有很多故事呢。你想听哪一个？',
                emotion: 'thinking',
                choices: [
                    {
                        id: 'choice_origin',
                        text: '岛屿的起源',
                        nextId: 'dialog_story_origin',
                    },
                    {
                        id: 'choice_moonfall',
                        text: '月光瀑布的传说',
                        nextId: 'dialog_story_moonfall',
                    },
                    {
                        id: 'choice_stars',
                        text: '为什么这里叫星月岛',
                        nextId: 'dialog_story_name',
                    },
                ],
            },
            {
                id: 'dialog_story_origin',
                speaker: 'island_elder',
                text: '传说很久以前，一位仙女路过这片云海，觉得太美了，便撒下一片花瓣，花瓣落在云上便成了这座岛...',
                emotion: 'neutral',
                next: 'dialog_story_end',
            },
            {
                id: 'dialog_story_moonfall',
                speaker: 'island_elder',
                text: '月光瀑布啊...传说那是月亮的眼泪。很久以前，月亮爱上了大海，但他们永远无法相遇，月亮的眼泪便化作了那道永恒的瀑布...',
                emotion: 'sad',
                next: 'dialog_story_end',
            },
            {
                id: 'dialog_story_name',
                speaker: 'island_elder',
                text: '在这座岛上，你能看到最近的星星和最圆的月亮。因为我们离天空很近，所以叫星月岛。',
                emotion: 'happy',
                next: 'dialog_story_end',
            },
            {
                id: 'dialog_story_end',
                speaker: 'island_elder',
                text: '年轻人，趁着还有时间，多去看看这座岛吧。每一处风景都藏着故事呢。',
                emotion: 'happy',
                effects: [
                    { type: 'set_flag', payload: { key: 'heard_elder_story', value: true } },
                ],
                next: null,
            },
        ],
    },
    {
        id: 'script_market_arrival',
        phase: 'destination',
        title: '云端集市',
        startNodeId: 'dialog_market_arrival',
        nodes: [
            {
                id: 'dialog_market_arrival',
                speaker: 'narrator',
                text: '集市上人声鼎沸，各种摊位摆满了奇珍异宝。空气中飘着食物的香气和花朵的芬芳。',
                next: 'dialog_market_look',
            },
            {
                id: 'dialog_market_look',
                speaker: 'player',
                text: '好热闹！这里的东西看起来都好有趣！',
                emotion: 'excited',
                next: null,
            },
        ],
    },
    {
        id: 'script_shop_browse',
        phase: 'destination',
        title: '逛商店',
        startNodeId: 'dialog_shop_browse',
        nodes: [
            {
                id: 'dialog_shop_browse',
                speaker: 'shop_owner',
                text: '欢迎光临！看看有什么喜欢的？',
                emotion: 'happy',
                next: 'dialog_shop_items',
            },
            {
                id: 'dialog_shop_items',
                speaker: 'narrator',
                text: '店铺里摆满了各种精美的手工艺品：星光水晶、月亮挂坠、云朵香囊...',
                choices: [
                    {
                        id: 'choice_crystal',
                        text: '看看星光水晶',
                        nextId: 'dialog_look_crystal',
                    },
                    {
                        id: 'choice_pendant',
                        text: '看看月亮挂坠',
                        nextId: 'dialog_look_pendant',
                    },
                    {
                        id: 'choice_leave',
                        text: '只是随便逛逛',
                        nextId: 'dialog_just_browse',
                    },
                ],
            },
            {
                id: 'dialog_look_crystal',
                speaker: 'shop_owner',
                text: '这是星光水晶，据说能在夜晚发出微弱的光芒。是岛上的特产，很受游客欢迎！',
                emotion: 'happy',
                next: 'dialog_buy_crystal',
            },
            {
                id: 'dialog_buy_crystal',
                speaker: 'narrator',
                text: '你买下了一颗星光水晶作为纪念。',
                effects: [
                    {
                        type: 'add_item',
                        payload: {
                            item: {
                                id: 'item_crystal',
                                name: '星光水晶',
                                description: '星月岛特产，据说夜晚会发出微弱的光芒',
                                type: 'souvenir',
                                icon: '💎',
                                quantity: 1,
                            },
                        },
                    },
                ],
                next: 'dialog_shop_thanks',
            },
            {
                id: 'dialog_look_pendant',
                speaker: 'shop_owner',
                text: '月亮挂坠，是我亲手做的！戴上它，月光会为你指引方向。',
                emotion: 'happy',
                next: 'dialog_buy_pendant',
            },
            {
                id: 'dialog_buy_pendant',
                speaker: 'narrator',
                text: '你买下了一个精美的月亮挂坠。',
                effects: [
                    {
                        type: 'add_item',
                        payload: {
                            item: {
                                id: 'item_pendant',
                                name: '月亮挂坠',
                                description: '精美的手工挂坠，据说能在月光下指引方向',
                                type: 'souvenir',
                                icon: '🌙',
                                quantity: 1,
                            },
                        },
                    },
                ],
                next: 'dialog_shop_thanks',
            },
            {
                id: 'dialog_just_browse',
                speaker: 'shop_owner',
                text: '没关系，慢慢看！有喜欢的随时告诉我。',
                emotion: 'neutral',
                next: null,
            },
            {
                id: 'dialog_shop_thanks',
                speaker: 'shop_owner',
                text: '谢谢惠顾！祝你在岛上玩得开心！',
                emotion: 'happy',
                next: null,
            },
        ],
    },
    {
        id: 'script_moonfall_arrival',
        phase: 'destination',
        title: '月光瀑布',
        startNodeId: 'dialog_moonfall_arrival',
        nodes: [
            {
                id: 'dialog_moonfall_arrival',
                speaker: 'narrator',
                text: '巨大的瀑布从云端倾泻而下，水珠在空中飞舞，如同无数颗细小的珍珠。虽然现在是白天，但瀑布的壮观已经令人叹为观止。',
                next: 'dialog_moonfall_amazed',
            },
            {
                id: 'dialog_moonfall_amazed',
                speaker: 'player',
                text: '太壮观了！如果是满月之夜来看，一定更美吧...',
                emotion: 'surprised',
                next: 'dialog_moonfall_photo',
            },
            {
                id: 'dialog_moonfall_photo',
                speaker: 'narrator',
                text: '你决定在这里拍一张照片留念。',
                effects: [
                    {
                        type: 'add_memory',
                        payload: {
                            memory: {
                                id: 'memory_moonfall',
                                title: '月光瀑布',
                                description: '壮观的云端瀑布，水珠如珍珠般闪烁',
                                image: 'https://placehold.co/600x400/1a3a5e/fff?text=月光瀑布',
                                acquiredAt: new Date().toISOString(),
                                sceneId: 'scene_moonfall',
                                phase: 'destination',
                            },
                        },
                    },
                    { type: 'set_flag', payload: { key: 'visited_moonfall', value: true } },
                ],
                next: null,
            },
        ],
    },
];
