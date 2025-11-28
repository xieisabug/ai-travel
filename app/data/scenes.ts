/**
 * 场景数据 - Mock
 */

import type { Scene } from '~/types/game';

/**
 * 所有场景配置
 */
export const scenes: Record<string, Scene> = {
    // ============================================
    // 规划阶段场景
    // ============================================
    scene_home_planning: {
        id: 'scene_home_planning',
        phase: 'planning',
        name: '家中书房',
        description: '温馨的书房，窗外阳光明媚。桌上摆满了旅行杂志和地图。',
        background: 'https://placehold.co/1920x1080/2d3748/f0f0f0?text=书房%5Cn规划旅行',
        hotspots: [
            {
                id: 'hotspot_magazines',
                x: 20,
                y: 60,
                width: 15,
                height: 20,
                label: '旅行杂志',
                type: 'dialog',
                targetId: 'dialog_browse_magazines',
                highlighted: true,
            },
            {
                id: 'hotspot_computer',
                x: 50,
                y: 40,
                width: 20,
                height: 25,
                label: '电脑',
                type: 'dialog',
                targetId: 'dialog_search_destinations',
                highlighted: true,
            },
        ],
        entryDialogId: 'dialog_planning_start',
    },

    // ============================================
    // 购票阶段场景
    // ============================================
    scene_booking_online: {
        id: 'scene_booking_online',
        phase: 'booking',
        name: '订票网站',
        description: '航班预订页面已打开，各种航班信息一目了然。',
        background: 'https://placehold.co/1920x1080/1e40af/f0f0f0?text=航班预订%5Cn选择你的旅程',
        hotspots: [
            {
                id: 'hotspot_flight_list',
                x: 30,
                y: 30,
                width: 40,
                height: 50,
                label: '查看航班',
                type: 'dialog',
                targetId: 'dialog_select_flight',
                highlighted: true,
            },
        ],
        entryDialogId: 'dialog_booking_start',
    },

    // ============================================
    // 出发阶段场景
    // ============================================
    scene_home_packing: {
        id: 'scene_home_packing',
        phase: 'departure',
        name: '卧室',
        description: '出发的日子终于到了！该收拾行李了。',
        background: 'https://placehold.co/1920x1080/4a5568/f0f0f0?text=卧室%5Cn整理行李',
        hotspots: [
            {
                id: 'hotspot_suitcase',
                x: 40,
                y: 50,
                width: 20,
                height: 30,
                label: '行李箱',
                type: 'dialog',
                targetId: 'dialog_pack_luggage',
                highlighted: true,
            },
            {
                id: 'hotspot_door',
                x: 85,
                y: 30,
                width: 10,
                height: 50,
                label: '出门',
                type: 'scene',
                targetId: 'scene_airport_entrance',
                condition: 'packed',
            },
        ],
        entryDialogId: 'dialog_departure_start',
    },
    scene_airport_entrance: {
        id: 'scene_airport_entrance',
        phase: 'departure',
        name: '机场入口',
        description: '繁忙的机场大厅，人来人往。',
        background: 'https://placehold.co/1920x1080/667eea/f0f0f0?text=机场大厅%5Cn出发',
        hotspots: [
            {
                id: 'hotspot_checkin',
                x: 30,
                y: 40,
                width: 20,
                height: 30,
                label: '值机柜台',
                type: 'dialog',
                targetId: 'dialog_checkin',
                highlighted: true,
            },
            {
                id: 'hotspot_security',
                x: 70,
                y: 40,
                width: 15,
                height: 30,
                label: '安检通道',
                type: 'scene',
                targetId: 'scene_airport_security',
                condition: 'checked_in',
            },
        ],
        entryDialogId: 'dialog_airport_arrival',
    },
    scene_airport_security: {
        id: 'scene_airport_security',
        phase: 'departure',
        name: '安检通道',
        description: '井然有序的安检区域。',
        background: 'https://placehold.co/1920x1080/4a5568/f0f0f0?text=安检通道',
        hotspots: [
            {
                id: 'hotspot_gate',
                x: 80,
                y: 40,
                width: 15,
                height: 40,
                label: '登机口',
                type: 'scene',
                targetId: 'scene_boarding_gate',
                condition: 'passed_security',
            },
        ],
        entryDialogId: 'dialog_security_check',
    },
    scene_boarding_gate: {
        id: 'scene_boarding_gate',
        phase: 'departure',
        name: '登机口',
        description: '登机口候机区，透过玻璃可以看到停机坪上的飞机。',
        background: 'https://placehold.co/1920x1080/3b82f6/f0f0f0?text=登机口%5Cn即将起飞',
        hotspots: [
            {
                id: 'hotspot_board',
                x: 50,
                y: 40,
                width: 20,
                height: 30,
                label: '登机',
                type: 'dialog',
                targetId: 'dialog_boarding',
                highlighted: true,
            },
        ],
        entryDialogId: 'dialog_waiting_board',
    },

    // ============================================
    // 旅途阶段场景
    // ============================================
    scene_airplane_cabin: {
        id: 'scene_airplane_cabin',
        phase: 'traveling',
        name: '飞机客舱',
        description: '舒适的座位，窗外是蔚蓝的天空和洁白的云海。',
        background: 'https://placehold.co/1920x1080/87ceeb/333?text=飞机客舱%5Cn云端之上',
        hotspots: [
            {
                id: 'hotspot_window',
                x: 10,
                y: 30,
                width: 15,
                height: 40,
                label: '窗外风景',
                type: 'dialog',
                targetId: 'dialog_window_view',
                highlighted: true,
            },
            {
                id: 'hotspot_neighbor',
                x: 60,
                y: 40,
                width: 20,
                height: 40,
                label: '邻座乘客',
                type: 'dialog',
                targetId: 'dialog_neighbor_chat',
            },
            {
                id: 'hotspot_call_attendant',
                x: 80,
                y: 20,
                width: 10,
                height: 15,
                label: '呼叫按钮',
                type: 'dialog',
                targetId: 'dialog_call_attendant',
            },
        ],
        entryDialogId: 'dialog_flight_start',
    },

    // ============================================
    // 目的地阶段场景 - 星月岛
    // ============================================
    scene_island_arrival: {
        id: 'scene_island_arrival',
        phase: 'destination',
        name: '星月岛码头',
        description: '云雾缭绕的码头，远处可以看到岛上若隐若现的建筑。',
        background: 'https://placehold.co/1920x1080/1a1a3e/f0f0f0?text=星月岛码头%5Cn欢迎来到梦幻之境',
        hotspots: [
            {
                id: 'hotspot_guide',
                x: 30,
                y: 50,
                width: 15,
                height: 35,
                label: '导游阿星',
                type: 'dialog',
                targetId: 'dialog_meet_guide',
                highlighted: true,
            },
            {
                id: 'hotspot_village_path',
                x: 70,
                y: 40,
                width: 20,
                height: 30,
                label: '通往村庄',
                type: 'scene',
                targetId: 'scene_island_village',
                condition: 'met_guide',
            },
        ],
        entryDialogId: 'dialog_island_arrival',
    },
    scene_island_village: {
        id: 'scene_island_village',
        phase: 'destination',
        name: '云端村庄',
        description: '宁静的村庄，房屋建在云朵之上，炊烟袅袅升起。',
        background: 'https://placehold.co/1920x1080/2d2d5e/f0f0f0?text=云端村庄',
        hotspots: [
            {
                id: 'hotspot_elder_house',
                x: 20,
                y: 40,
                width: 20,
                height: 35,
                label: '长者居所',
                type: 'dialog',
                targetId: 'dialog_visit_elder',
            },
            {
                id: 'hotspot_market',
                x: 50,
                y: 50,
                width: 20,
                height: 30,
                label: '云端集市',
                type: 'scene',
                targetId: 'scene_cloud_market',
            },
            {
                id: 'hotspot_moonfall',
                x: 80,
                y: 30,
                width: 15,
                height: 25,
                label: '月光瀑布',
                type: 'scene',
                targetId: 'scene_moonfall',
            },
        ],
        entryDialogId: 'dialog_village_arrival',
    },
    scene_cloud_market: {
        id: 'scene_cloud_market',
        phase: 'destination',
        name: '云端集市',
        description: '热闹非凡的集市，各种奇珍异宝琳琅满目。',
        background: 'https://placehold.co/1920x1080/3d2d4e/f0f0f0?text=云端集市%5Cn寻找宝物',
        hotspots: [
            {
                id: 'hotspot_shop',
                x: 40,
                y: 45,
                width: 20,
                height: 35,
                label: '云掌柜的店',
                type: 'dialog',
                targetId: 'dialog_shop_browse',
                highlighted: true,
            },
            {
                id: 'hotspot_back',
                x: 10,
                y: 50,
                width: 10,
                height: 30,
                label: '返回村庄',
                type: 'scene',
                targetId: 'scene_island_village',
            },
        ],
        entryDialogId: 'dialog_market_arrival',
    },
    scene_moonfall: {
        id: 'scene_moonfall',
        phase: 'destination',
        name: '月光瀑布',
        description: '壮观的瀑布从云端倾泻而下，水珠在月光下闪烁着银光。',
        background: 'https://placehold.co/1920x1080/1a3a5e/f0f0f0?text=月光瀑布%5Cn绝美奇观',
        hotspots: [
            {
                id: 'hotspot_photo',
                x: 50,
                y: 40,
                width: 20,
                height: 30,
                label: '拍照留念',
                type: 'action',
                targetId: 'action_take_photo',
                highlighted: true,
            },
            {
                id: 'hotspot_back',
                x: 10,
                y: 60,
                width: 10,
                height: 25,
                label: '返回村庄',
                type: 'scene',
                targetId: 'scene_island_village',
            },
        ],
        entryDialogId: 'dialog_moonfall_arrival',
    },

    // ============================================
    // 返程阶段场景
    // ============================================
    scene_island_farewell: {
        id: 'scene_island_farewell',
        phase: 'return',
        name: '星月岛码头',
        description: '离别的时刻到了，岛民们前来送别。',
        background: 'https://placehold.co/1920x1080/1a1a3e/f0f0f0?text=告别星月岛',
        hotspots: [
            {
                id: 'hotspot_say_goodbye',
                x: 40,
                y: 50,
                width: 20,
                height: 35,
                label: '告别朋友',
                type: 'dialog',
                targetId: 'dialog_farewell',
                highlighted: true,
            },
        ],
        entryDialogId: 'dialog_return_start',
    },
    scene_return_flight: {
        id: 'scene_return_flight',
        phase: 'return',
        name: '返程航班',
        description: '飞机起飞，星月岛渐渐消失在云海之中。',
        background: 'https://placehold.co/1920x1080/87ceeb/333?text=返程航班%5Cn满载回忆',
        hotspots: [],
        entryDialogId: 'dialog_return_flight',
    },

    // ============================================
    // 归家阶段场景
    // ============================================
    scene_home_return: {
        id: 'scene_home_return',
        phase: 'home',
        name: '家中客厅',
        description: '熟悉的家，桌上放着从旅途中带回的纪念品。',
        background: 'https://placehold.co/1920x1080/4a5568/f0f0f0?text=回到家中%5Cn旅程结束',
        hotspots: [
            {
                id: 'hotspot_souvenirs',
                x: 30,
                y: 50,
                width: 20,
                height: 25,
                label: '纪念品',
                type: 'dialog',
                targetId: 'dialog_view_souvenirs',
            },
            {
                id: 'hotspot_album',
                x: 60,
                y: 50,
                width: 20,
                height: 25,
                label: '回忆相册',
                type: 'dialog',
                targetId: 'dialog_view_album',
                highlighted: true,
            },
        ],
        entryDialogId: 'dialog_home_return',
    },
};

/**
 * 根据 ID 获取场景
 */
export function getSceneById(id: string): Scene | undefined {
    return scenes[id];
}

/**
 * 获取阶段的所有场景
 */
export function getScenesByPhase(phase: string): Scene[] {
    return Object.values(scenes).filter(s => s.phase === phase);
}

/**
 * 获取阶段的起始场景
 */
export function getPhaseStartScene(phase: string): Scene | undefined {
    const phaseScenes = getScenesByPhase(phase);
    return phaseScenes[0];
}
