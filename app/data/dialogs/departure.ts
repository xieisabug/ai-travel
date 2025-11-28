/**
 * 对话数据 - Mock
 * 出发阶段对话
 */

import type { DialogScript } from '~/types/game';

export const departureDialogs: DialogScript[] = [
    {
        id: 'script_departure_start',
        phase: 'departure',
        title: '出发日开始',
        startNodeId: 'dialog_departure_start',
        nodes: [
            {
                id: 'dialog_departure_start',
                speaker: 'narrator',
                text: '闹钟响起，窗外天还没完全亮。今天就是出发的日子！',
                next: 'dialog_wake_up',
            },
            {
                id: 'dialog_wake_up',
                speaker: 'player',
                text: '终于等到这一天了！赶紧收拾行李出发！',
                emotion: 'excited',
                next: 'dialog_pack_luggage',
            },
            {
                id: 'dialog_pack_luggage',
                speaker: 'narrator',
                text: '你开始整理行李。需要带什么呢？',
                choices: [
                    {
                        id: 'choice_pack_light',
                        text: '轻装出行 - 只带必需品',
                        nextId: 'dialog_light_pack',
                    },
                    {
                        id: 'choice_pack_full',
                        text: '充分准备 - 带上各种可能用到的东西',
                        nextId: 'dialog_full_pack',
                    },
                ],
            },
            {
                id: 'dialog_light_pack',
                speaker: 'player',
                text: '旅行最重要的是心情！带太多东西反而是累赘。',
                emotion: 'happy',
                effects: [
                    { type: 'set_flag', payload: { key: 'pack_style', value: 'light' } },
                    { type: 'set_flag', payload: { key: 'packed', value: true } },
                ],
                next: 'dialog_ready_to_go',
            },
            {
                id: 'dialog_full_pack',
                speaker: 'player',
                text: '有备无患！万一需要什么东西呢。',
                emotion: 'thinking',
                effects: [
                    { type: 'set_flag', payload: { key: 'pack_style', value: 'full' } },
                    { type: 'set_flag', payload: { key: 'packed', value: true } },
                ],
                next: 'dialog_ready_to_go',
            },
            {
                id: 'dialog_ready_to_go',
                speaker: 'narrator',
                text: '行李收拾妥当，检查了一遍证件和机票，一切就绪。是时候出发去机场了！',
                effects: [
                    { type: 'change_scene', payload: { sceneId: 'scene_airport_entrance' } },
                ],
                next: null,
            },
        ],
    },
    {
        id: 'script_airport_arrival',
        phase: 'departure',
        title: '到达机场',
        startNodeId: 'dialog_airport_arrival',
        nodes: [
            {
                id: 'dialog_airport_arrival',
                speaker: 'narrator',
                text: '机场大厅人来人往，各种语言交织在一起。大屏幕上显示着航班信息，你的航班正在等待值机。',
                next: 'dialog_find_counter',
            },
            {
                id: 'dialog_find_counter',
                speaker: 'player',
                text: '先去值机柜台办理手续吧。',
                emotion: 'neutral',
                next: null,
            },
        ],
    },
    {
        id: 'script_checkin',
        phase: 'departure',
        title: '办理值机',
        startNodeId: 'dialog_checkin',
        nodes: [
            {
                id: 'dialog_checkin',
                speaker: 'airport_staff',
                text: '您好！请出示您的证件和订单信息。',
                emotion: 'happy',
                next: 'dialog_show_ticket',
            },
            {
                id: 'dialog_show_ticket',
                speaker: 'narrator',
                text: '你将证件和电子机票出示给工作人员。',
                next: 'dialog_staff_check',
            },
            {
                id: 'dialog_staff_check',
                speaker: 'airport_staff',
                text: '好的，前往星月岛的航班...您的座位已经确认。这是您的登机牌。',
                emotion: 'happy',
                next: 'dialog_receive_pass',
            },
            {
                id: 'dialog_receive_pass',
                speaker: 'narrator',
                text: '你接过登机牌，上面印着航班信息和登机口号码。',
                effects: [
                    { type: 'set_flag', payload: { key: 'checked_in', value: true } },
                    {
                        type: 'add_item',
                        payload: {
                            item: {
                                id: 'item_boarding_pass',
                                name: '登机牌',
                                description: '前往星月岛的登机牌，记得带好！',
                                type: 'document',
                                icon: '🎟️',
                                quantity: 1,
                            },
                        },
                    },
                ],
                next: 'dialog_staff_goodbye',
            },
            {
                id: 'dialog_staff_goodbye',
                speaker: 'airport_staff',
                text: '祝您旅途愉快！请前往安检通道。',
                emotion: 'happy',
                next: 'dialog_to_security',
            },
            {
                id: 'dialog_to_security',
                speaker: 'player',
                text: '谢谢！下一步去安检了。',
                emotion: 'happy',
                next: null,
            },
        ],
    },
    {
        id: 'script_security',
        phase: 'departure',
        title: '安检',
        startNodeId: 'dialog_security_check',
        nodes: [
            {
                id: 'dialog_security_check',
                speaker: 'security_guard',
                text: '请将随身物品放入安检筐，电子设备单独取出。',
                emotion: 'neutral',
                next: 'dialog_pass_security',
            },
            {
                id: 'dialog_pass_security',
                speaker: 'narrator',
                text: '你配合完成了安检流程，一切顺利。',
                effects: [
                    { type: 'set_flag', payload: { key: 'passed_security', value: true } },
                ],
                next: 'dialog_security_done',
            },
            {
                id: 'dialog_security_done',
                speaker: 'security_guard',
                text: '可以通过了，祝您旅途愉快。',
                emotion: 'neutral',
                next: 'dialog_to_gate',
            },
            {
                id: 'dialog_to_gate',
                speaker: 'player',
                text: '谢谢！该去登机口等候了。',
                emotion: 'neutral',
                effects: [
                    { type: 'change_scene', payload: { sceneId: 'scene_boarding_gate' } },
                ],
                next: null,
            },
        ],
    },
    {
        id: 'script_boarding',
        phase: 'departure',
        title: '登机',
        startNodeId: 'dialog_waiting_board',
        nodes: [
            {
                id: 'dialog_waiting_board',
                speaker: 'narrator',
                text: '透过巨大的落地窗，可以看到停机坪上的飞机。那就是即将载你前往星月岛的航班。',
                next: 'dialog_boarding_announce',
            },
            {
                id: 'dialog_boarding_announce',
                speaker: 'narrator',
                text: '"前往星月岛的航班现在开始登机，请乘客们有序排队..."',
                next: 'dialog_boarding',
            },
            {
                id: 'dialog_boarding',
                speaker: 'player',
                text: '终于要上飞机了！冒险正式开始！',
                emotion: 'excited',
                effects: [
                    {
                        type: 'change_phase',
                        payload: { phase: 'traveling' },
                    },
                ],
                next: null,
            },
        ],
    },
];
