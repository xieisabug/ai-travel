/**
 * 对话数据 - Mock
 * 旅途阶段对话
 */

import type { DialogScript } from '~/types/game';

export const travelingDialogs: DialogScript[] = [
    {
        id: 'script_flight_start',
        phase: 'traveling',
        title: '飞行开始',
        startNodeId: 'dialog_flight_start',
        nodes: [
            {
                id: 'dialog_flight_start',
                speaker: 'narrator',
                text: '飞机平稳地升入云端，耳边是发动机轻微的嗡鸣声。窗外的景色逐渐从城市变成了一望无际的云海。',
                next: 'dialog_settle_in',
            },
            {
                id: 'dialog_settle_in',
                speaker: 'player',
                text: '终于起飞了...接下来有几个小时的飞行时间，做点什么好呢？',
                emotion: 'thinking',
                next: null,
            },
        ],
    },
    {
        id: 'script_window_view',
        phase: 'traveling',
        title: '窗外风景',
        startNodeId: 'dialog_window_view',
        nodes: [
            {
                id: 'dialog_window_view',
                speaker: 'narrator',
                text: '透过舷窗望出去，洁白的云海在阳光下闪闪发光，偶尔能看到云层下方若隐若现的大地。',
                next: 'dialog_beautiful_view',
            },
            {
                id: 'dialog_beautiful_view',
                speaker: 'player',
                text: '真美啊...就像是在天空中航行一样。',
                emotion: 'happy',
                next: 'dialog_take_photo_window',
            },
            {
                id: 'dialog_take_photo_window',
                speaker: 'narrator',
                text: '你用手机拍下了这片云海的美景。',
                effects: [
                    {
                        type: 'add_memory',
                        payload: {
                            memory: {
                                id: 'memory_cloud_sea',
                                title: '云海之上',
                                description: '飞行途中拍摄的云海美景',
                                image: 'https://placehold.co/600x400/87ceeb/fff?text=云海美景',
                                acquiredAt: new Date().toISOString(),
                                sceneId: 'scene_airplane_cabin',
                                phase: 'traveling',
                            },
                        },
                    },
                ],
                next: 'dialog_photo_taken',
            },
            {
                id: 'dialog_photo_taken',
                speaker: 'player',
                text: '第一张旅途照片！希望接下来能拍到更多美景。',
                emotion: 'excited',
                next: null,
            },
        ],
    },
    {
        id: 'script_neighbor_chat',
        phase: 'traveling',
        title: '与邻座交谈',
        startNodeId: 'dialog_neighbor_chat',
        nodes: [
            {
                id: 'dialog_neighbor_chat',
                speaker: 'narrator',
                text: '你注意到邻座的乘客也在看向窗外，似乎是个经验丰富的旅行者。',
                next: 'dialog_neighbor_notice',
            },
            {
                id: 'dialog_neighbor_notice',
                speaker: 'seat_neighbor',
                text: '你好啊！也是去星月岛的吗？',
                emotion: 'happy',
                next: 'dialog_player_confirm',
            },
            {
                id: 'dialog_player_confirm',
                speaker: 'player',
                text: '是的！这是我第一次去。',
                emotion: 'happy',
                next: 'dialog_neighbor_intro',
            },
            {
                id: 'dialog_neighbor_intro',
                speaker: 'seat_neighbor',
                text: '我叫阿明，是个旅行作家。星月岛我已经去过三次了，每次都有新的发现！',
                emotion: 'excited',
                next: 'dialog_ask_tips',
            },
            {
                id: 'dialog_ask_tips',
                speaker: 'narrator',
                text: '要向这位经验丰富的旅行者请教一下吗？',
                choices: [
                    {
                        id: 'choice_ask_attraction',
                        text: '问问有什么推荐的景点',
                        nextId: 'dialog_recommend_attraction',
                    },
                    {
                        id: 'choice_ask_local',
                        text: '问问当地有什么特别的事物',
                        nextId: 'dialog_local_info',
                    },
                    {
                        id: 'choice_just_chat',
                        text: '只是闲聊几句',
                        nextId: 'dialog_casual_chat',
                    },
                ],
            },
            {
                id: 'dialog_recommend_attraction',
                speaker: 'seat_neighbor',
                text: '月光瀑布一定要去！尤其是满月的晚上，瀑布会发出银色的光芒，美得像梦境一样！',
                emotion: 'excited',
                effects: [
                    { type: 'set_flag', payload: { key: 'moonfall_recommended', value: true } },
                ],
                next: 'dialog_neighbor_tip_end',
            },
            {
                id: 'dialog_local_info',
                speaker: 'seat_neighbor',
                text: '岛上有个叫月婆婆的老人，她知道很多岛上的秘密。如果遇到她，一定要跟她聊聊！',
                emotion: 'thinking',
                effects: [
                    { type: 'set_flag', payload: { key: 'elder_mentioned', value: true } },
                ],
                next: 'dialog_neighbor_tip_end',
            },
            {
                id: 'dialog_casual_chat',
                speaker: 'seat_neighbor',
                text: '旅行的乐趣就在于未知啊！保持好奇心，你会发现很多惊喜的。',
                emotion: 'happy',
                next: 'dialog_neighbor_tip_end',
            },
            {
                id: 'dialog_neighbor_tip_end',
                speaker: 'player',
                text: '谢谢你的建议！真期待到达后的探索！',
                emotion: 'happy',
                effects: [
                    { type: 'set_flag', payload: { key: 'talked_to_neighbor', value: true } },
                ],
                next: null,
            },
        ],
    },
    {
        id: 'script_call_attendant',
        phase: 'traveling',
        title: '呼叫空乘',
        startNodeId: 'dialog_call_attendant',
        nodes: [
            {
                id: 'dialog_call_attendant',
                speaker: 'narrator',
                text: '你按下了呼叫按钮，很快一位空姐走了过来。',
                next: 'dialog_attendant_greet',
            },
            {
                id: 'dialog_attendant_greet',
                speaker: 'flight_attendant',
                text: '您好，请问有什么需要帮助的吗？',
                emotion: 'happy',
                next: 'dialog_attendant_choice',
            },
            {
                id: 'dialog_attendant_choice',
                speaker: 'narrator',
                text: '你想要什么？',
                choices: [
                    {
                        id: 'choice_drink',
                        text: '要一杯饮料',
                        nextId: 'dialog_order_drink',
                    },
                    {
                        id: 'choice_blanket',
                        text: '需要一条毯子',
                        nextId: 'dialog_get_blanket',
                    },
                    {
                        id: 'choice_nothing',
                        text: '没什么，不好意思按错了',
                        nextId: 'dialog_nothing_needed',
                    },
                ],
            },
            {
                id: 'dialog_order_drink',
                speaker: 'flight_attendant',
                text: '好的，我们有果汁、茶和咖啡，您想要哪种？',
                emotion: 'happy',
                next: 'dialog_get_juice',
            },
            {
                id: 'dialog_get_juice',
                speaker: 'player',
                text: '果汁就好，谢谢！',
                emotion: 'happy',
                next: 'dialog_drink_served',
            },
            {
                id: 'dialog_drink_served',
                speaker: 'flight_attendant',
                text: '这是您的果汁，请慢用~',
                emotion: 'happy',
                next: null,
            },
            {
                id: 'dialog_get_blanket',
                speaker: 'flight_attendant',
                text: '好的，请稍等。',
                emotion: 'neutral',
                next: 'dialog_blanket_given',
            },
            {
                id: 'dialog_blanket_given',
                speaker: 'narrator',
                text: '空姐递给你一条柔软的毯子。盖上毯子后，感觉舒服多了。',
                next: null,
            },
            {
                id: 'dialog_nothing_needed',
                speaker: 'flight_attendant',
                text: '没关系，如果需要什么随时呼叫我们~',
                emotion: 'happy',
                next: null,
            },
        ],
    },
    {
        id: 'script_arriving',
        phase: 'traveling',
        title: '即将抵达',
        startNodeId: 'dialog_arriving',
        nodes: [
            {
                id: 'dialog_arriving',
                speaker: 'narrator',
                text: '"各位乘客，我们即将抵达星月岛，请系好安全带，收起小桌板..."',
                next: 'dialog_see_island',
            },
            {
                id: 'dialog_see_island',
                speaker: 'narrator',
                text: '窗外出现了一座云雾缭绕的岛屿，时隐时现。那就是传说中的星月岛！',
                next: 'dialog_excited_arrival',
            },
            {
                id: 'dialog_excited_arrival',
                speaker: 'player',
                text: '终于到了！它比我想象中的还要神秘！',
                emotion: 'excited',
                effects: [
                    {
                        type: 'change_phase',
                        payload: { phase: 'destination' },
                    },
                ],
                next: null,
            },
        ],
    },
];
