/**
 * 对话数据 - Mock
 * 购票阶段对话
 */

import type { DialogScript } from '~/types/game';

export const bookingDialogs: DialogScript[] = [
    {
        id: 'script_booking_start',
        phase: 'booking',
        title: '购票开始',
        startNodeId: 'dialog_booking_start',
        nodes: [
            {
                id: 'dialog_booking_start',
                speaker: 'narrator',
                text: '打开航班预订页面，输入目的地"星月岛"。几秒钟后，屏幕上显示出了可用的航班列表。',
                next: 'dialog_view_flights',
            },
            {
                id: 'dialog_view_flights',
                speaker: 'narrator',
                text: '有几个航班可供选择，价格和时间各有不同。仔细看看吧。',
                next: 'dialog_select_flight',
            },
            {
                id: 'dialog_select_flight',
                speaker: 'narrator',
                text: '【航班选择】\n\n🛫 云翔航空 CY-888\n   出发: 08:00 | 到达: 14:00\n   经济舱 ¥2,888\n\n🛫 星月航空 XY-666\n   出发: 10:30 | 到达: 16:30\n   经济舱 ¥3,288\n\n选择哪一班呢？',
                choices: [
                    {
                        id: 'choice_flight_cy888',
                        text: '选择云翔航空 CY-888 (¥2,888)',
                        nextId: 'dialog_flight_cy888_selected',
                        effects: [
                            {
                                type: 'set_flag',
                                payload: {
                                    key: 'selected_flight',
                                    value: {
                                        id: 'flight_cy888',
                                        flightNumber: 'CY-888',
                                        airline: '云翔航空',
                                        departureTime: '08:00',
                                        arrivalTime: '14:00',
                                        price: 2888,
                                    },
                                },
                            },
                        ],
                    },
                    {
                        id: 'choice_flight_xy666',
                        text: '选择星月航空 XY-666 (¥3,288)',
                        nextId: 'dialog_flight_xy666_selected',
                        effects: [
                            {
                                type: 'set_flag',
                                payload: {
                                    key: 'selected_flight',
                                    value: {
                                        id: 'flight_xy666',
                                        flightNumber: 'XY-666',
                                        airline: '星月航空',
                                        departureTime: '10:30',
                                        arrivalTime: '16:30',
                                        price: 3288,
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
            {
                id: 'dialog_flight_cy888_selected',
                speaker: 'player',
                text: '早起赶飞机虽然辛苦，但可以省点钱，而且能早点到达！',
                emotion: 'thinking',
                next: 'dialog_select_seat',
            },
            {
                id: 'dialog_flight_xy666_selected',
                speaker: 'player',
                text: '星月航空听起来很配这次旅行的主题呢！而且不用起那么早。',
                emotion: 'happy',
                next: 'dialog_select_seat',
            },
            {
                id: 'dialog_select_seat',
                speaker: 'narrator',
                text: '接下来选择座位。你更喜欢靠窗还是靠过道呢？',
                choices: [
                    {
                        id: 'choice_window',
                        text: '靠窗座位 - 可以欣赏风景',
                        nextId: 'dialog_window_selected',
                        effects: [
                            { type: 'set_flag', payload: { key: 'seat_type', value: 'window' } },
                        ],
                    },
                    {
                        id: 'choice_aisle',
                        text: '靠过道座位 - 进出方便',
                        nextId: 'dialog_aisle_selected',
                        effects: [
                            { type: 'set_flag', payload: { key: 'seat_type', value: 'aisle' } },
                        ],
                    },
                ],
            },
            {
                id: 'dialog_window_selected',
                speaker: 'player',
                text: '当然要选靠窗的座位！这样就能看到云海和星月岛的全貌了。',
                emotion: 'excited',
                next: 'dialog_confirm_booking',
            },
            {
                id: 'dialog_aisle_selected',
                speaker: 'player',
                text: '选靠过道的座位吧，长途飞行还是方便一点好。',
                emotion: 'neutral',
                next: 'dialog_confirm_booking',
            },
            {
                id: 'dialog_confirm_booking',
                speaker: 'narrator',
                text: '确认订单信息无误后，你完成了支付。',
                next: 'dialog_booking_success',
            },
            {
                id: 'dialog_booking_success',
                speaker: 'narrator',
                text: '叮！邮箱收到了电子机票确认函。一切就绪，只等出发那天的到来！',
                effects: [
                    {
                        type: 'set_flag',
                        payload: { key: 'ticket_booked', value: true },
                    },
                    {
                        type: 'add_item',
                        payload: {
                            item: {
                                id: 'item_ticket',
                                name: '电子机票',
                                description: '前往星月岛的航班机票',
                                type: 'ticket',
                                icon: '🎫',
                                quantity: 1,
                            },
                        },
                    },
                ],
                next: 'dialog_booking_end',
            },
            {
                id: 'dialog_booking_end',
                speaker: 'player',
                text: '太棒了！真期待出发的那一天！',
                emotion: 'excited',
                effects: [
                    {
                        type: 'change_phase',
                        payload: { phase: 'departure' },
                    },
                ],
                next: null,
            },
        ],
    },
];
