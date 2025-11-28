/**
 * 对话数据 - Mock
 * 返程阶段对话
 */

import type { DialogScript } from '~/types/game';

export const returnDialogs: DialogScript[] = [
    {
        id: 'script_return_start',
        phase: 'return',
        title: '返程开始',
        startNodeId: 'dialog_return_start',
        nodes: [
            {
                id: 'dialog_return_start',
                speaker: 'narrator',
                text: '美好的时光总是过得飞快。转眼间，已经到了离开星月岛的时候。',
                next: 'dialog_return_feeling',
            },
            {
                id: 'dialog_return_feeling',
                speaker: 'player',
                text: '真不舍得离开这里...这几天过得太快了。',
                emotion: 'sad',
                next: 'dialog_guide_farewell',
            },
            {
                id: 'dialog_guide_farewell',
                speaker: 'island_guide',
                text: '别难过！星月岛会永远欢迎你回来的！',
                emotion: 'happy',
                next: 'dialog_elder_farewell',
            },
            {
                id: 'dialog_elder_farewell',
                speaker: 'island_elder',
                text: '年轻人，带着美好的回忆离开吧。每一段旅程都是生命中的宝藏。',
                emotion: 'happy',
                next: null,
            },
        ],
    },
    {
        id: 'script_farewell',
        phase: 'return',
        title: '告别',
        startNodeId: 'dialog_farewell',
        nodes: [
            {
                id: 'dialog_farewell',
                speaker: 'island_guide',
                text: '一路顺风！记得常回来看看！',
                emotion: 'happy',
                next: 'dialog_promise',
            },
            {
                id: 'dialog_promise',
                speaker: 'player',
                text: '我一定会再来的！谢谢你们这几天的照顾！',
                emotion: 'happy',
                next: 'dialog_wave_goodbye',
            },
            {
                id: 'dialog_wave_goodbye',
                speaker: 'narrator',
                text: '岛民们在码头挥手告别，你踏上了返程的船只。回头望去，星月岛渐渐消失在云雾中...',
                effects: [
                    {
                        type: 'add_memory',
                        payload: {
                            memory: {
                                id: 'memory_farewell',
                                title: '告别星月岛',
                                description: '码头上挥手告别的岛民们',
                                image: 'https://placehold.co/600x400/1a1a3e/fff?text=告别时刻',
                                acquiredAt: new Date().toISOString(),
                                sceneId: 'scene_island_farewell',
                                phase: 'return',
                            },
                        },
                    },
                    { type: 'change_scene', payload: { sceneId: 'scene_return_flight' } },
                ],
                next: null,
            },
        ],
    },
    {
        id: 'script_return_flight',
        phase: 'return',
        title: '返程航班',
        startNodeId: 'dialog_return_flight',
        nodes: [
            {
                id: 'dialog_return_flight',
                speaker: 'narrator',
                text: '飞机再次升入云端。透过舷窗，你看到星月岛最后一次出现在视野中，然后被云海吞没。',
                next: 'dialog_reflect',
            },
            {
                id: 'dialog_reflect',
                speaker: 'player',
                text: '再见了，星月岛...这次旅行，我永远不会忘记。',
                emotion: 'sad',
                next: 'dialog_memories_flow',
            },
            {
                id: 'dialog_memories_flow',
                speaker: 'narrator',
                text: '闭上眼睛，这几天的画面像走马灯一样在脑海中浮现：月光瀑布、星辰花园、热情的阿星、慈祥的月婆婆...',
                next: 'dialog_sleep',
            },
            {
                id: 'dialog_sleep',
                speaker: 'narrator',
                text: '不知不觉，你在回忆中睡着了。当你醒来时，飞机已经开始降落...',
                effects: [
                    {
                        type: 'change_phase',
                        payload: { phase: 'home' },
                    },
                ],
                next: null,
            },
        ],
    },
];
