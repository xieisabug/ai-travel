/**
 * 对话数据 - Mock
 * 归家阶段对话
 */

import type { DialogScript } from '~/types/game';

export const homeDialogs: DialogScript[] = [
    {
        id: 'script_home_return',
        phase: 'home',
        title: '回到家',
        startNodeId: 'dialog_home_return',
        nodes: [
            {
                id: 'dialog_home_return',
                speaker: 'narrator',
                text: '熟悉的家门打开了。虽然只离开了几天，但感觉像是过了很久。',
                next: 'dialog_home_feeling',
            },
            {
                id: 'dialog_home_feeling',
                speaker: 'player',
                text: '回家了...还是家里舒服啊。',
                emotion: 'happy',
                next: 'dialog_unpack',
            },
            {
                id: 'dialog_unpack',
                speaker: 'narrator',
                text: '你把行李放下，取出了从星月岛带回来的纪念品，小心翼翼地摆在桌上。',
                next: null,
            },
        ],
    },
    {
        id: 'script_view_souvenirs',
        phase: 'home',
        title: '看纪念品',
        startNodeId: 'dialog_view_souvenirs',
        nodes: [
            {
                id: 'dialog_view_souvenirs',
                speaker: 'narrator',
                text: '桌上摆着从星月岛带回来的纪念品，每一件都承载着美好的回忆。',
                next: 'dialog_touch_souvenirs',
            },
            {
                id: 'dialog_touch_souvenirs',
                speaker: 'player',
                text: '看到这些东西，就好像又回到了那个神奇的地方...',
                emotion: 'happy',
                next: null,
            },
        ],
    },
    {
        id: 'script_view_album',
        phase: 'home',
        title: '回忆相册',
        startNodeId: 'dialog_view_album',
        nodes: [
            {
                id: 'dialog_view_album',
                speaker: 'narrator',
                text: '你打开手机相册，这次旅行拍下的照片一张张映入眼帘。',
                next: 'dialog_browse_photos',
            },
            {
                id: 'dialog_browse_photos',
                speaker: 'player',
                text: '每一张照片都是一段故事...云海、瀑布、集市、还有那些可爱的人们。',
                emotion: 'happy',
                next: 'dialog_write_journal',
            },
            {
                id: 'dialog_write_journal',
                speaker: 'narrator',
                text: '你决定写一篇旅行日记，记录下这次难忘的旅程。',
                next: 'dialog_journal_title',
            },
            {
                id: 'dialog_journal_title',
                speaker: 'narrator',
                text: '【旅行日记】\n\n《梦幻星月岛之旅》\n\n这是一次终生难忘的旅行...',
                next: 'dialog_journal_content',
            },
            {
                id: 'dialog_journal_content',
                speaker: 'narrator',
                text: '从踏上飞机的那一刻起，我就知道这会是一次特别的冒险。星月岛，一个漂浮在云海之上的神秘岛屿，它的美超出了我所有的想象...',
                next: 'dialog_journal_end',
            },
            {
                id: 'dialog_journal_end',
                speaker: 'narrator',
                text: '...虽然旅程结束了，但这些回忆会永远留在心中。期待下一次的冒险！',
                next: 'dialog_game_complete',
            },
            {
                id: 'dialog_game_complete',
                speaker: 'narrator',
                text: '🎉 恭喜你完成了星月岛之旅！\n\n感谢你的游玩，希望这次虚拟旅行给你带来了快乐。\n\n期待与你再次相遇！',
                effects: [
                    { type: 'set_flag', payload: { key: 'game_completed', value: true } },
                    {
                        type: 'unlock_achievement',
                        payload: { achievementId: 'achievement_complete_journey' },
                    },
                ],
                next: null,
            },
        ],
    },
];
