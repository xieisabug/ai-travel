/**
 * 对话数据 - Mock
 * 规划阶段对话
 */

import type { DialogScript } from '~/types/game';

export const planningDialogs: DialogScript[] = [
    {
        id: 'script_planning_start',
        phase: 'planning',
        title: '规划旅行开始',
        startNodeId: 'dialog_planning_start',
        nodes: [
            {
                id: 'dialog_planning_start',
                speaker: 'narrator',
                text: '阳光透过窗帘洒进书房，空气中弥漫着咖啡的香气。今天是个适合规划冒险的好日子。',
                next: 'dialog_planning_thought',
            },
            {
                id: 'dialog_planning_thought',
                speaker: 'player',
                text: '是时候来一场说走就走的旅行了！让我看看有什么有趣的目的地...',
                next: 'dialog_planning_choice',
            },
            {
                id: 'dialog_planning_choice',
                speaker: 'narrator',
                text: '桌上摆着几本旅行杂志，电脑屏幕上还开着旅游网站。从哪里开始了解呢？',
                choices: [
                    {
                        id: 'choice_magazines',
                        text: '翻阅旅行杂志',
                        nextId: 'dialog_browse_magazines',
                    },
                    {
                        id: 'choice_computer',
                        text: '在网上搜索目的地',
                        nextId: 'dialog_search_destinations',
                    },
                ],
            },
            {
                id: 'dialog_browse_magazines',
                speaker: 'narrator',
                text: '你拿起一本名为《梦幻旅途》的杂志，封面上是一座漂浮在云海之上的神秘岛屿。',
                next: 'dialog_magazine_content',
            },
            {
                id: 'dialog_magazine_content',
                speaker: 'narrator',
                text: '"星月岛——梦幻之境"，副标题这样写道。文章描述了这个传说中的地方：永恒的星光、银色的月光瀑布、以及守护秘密的岛民...',
                next: 'dialog_interested',
            },
            {
                id: 'dialog_search_destinations',
                speaker: 'narrator',
                text: '你打开旅游网站，屏幕上跳出了几个热门推荐目的地。其中一个特别吸引你的注意——星月岛。',
                next: 'dialog_website_content',
            },
            {
                id: 'dialog_website_content',
                speaker: 'narrator',
                text: '网页上的介绍令人心动：云端的神秘岛屿、只在夜间绽放的星辰花朵、还有传说中能听到星星歌唱的满月之夜...',
                next: 'dialog_interested',
            },
            {
                id: 'dialog_interested',
                speaker: 'player',
                text: '这个地方太神奇了！我一定要去看看！',
                emotion: 'excited',
                next: 'dialog_decide_destination',
            },
            {
                id: 'dialog_decide_destination',
                speaker: 'narrator',
                text: '心中已经有了答案。下一步，就是预订前往星月岛的航班了。',
                effects: [
                    {
                        type: 'set_flag',
                        payload: { key: 'destination_chosen', value: true },
                    },
                    {
                        type: 'change_phase',
                        payload: { phase: 'booking' },
                    },
                ],
                next: null,
            },
        ],
    },
];
