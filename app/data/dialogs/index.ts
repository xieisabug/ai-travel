/**
 * 对话数据 - 汇总导出
 */

import type { DialogScript, DialogNode, GamePhase } from '~/types/game';

import { planningDialogs } from './planning';
import { bookingDialogs } from './booking';
import { departureDialogs } from './departure';
import { travelingDialogs } from './traveling';
import { destinationDialogs } from './destination';
import { returnDialogs } from './return';
import { homeDialogs } from './home';

/**
 * 所有对话脚本
 */
export const allDialogScripts: DialogScript[] = [
    ...planningDialogs,
    ...bookingDialogs,
    ...departureDialogs,
    ...travelingDialogs,
    ...destinationDialogs,
    ...returnDialogs,
    ...homeDialogs,
];

/**
 * 对话脚本映射（按 ID）
 */
export const dialogScriptsById: Record<string, DialogScript> = {};
for (const script of allDialogScripts) {
    dialogScriptsById[script.id] = script;
}

/**
 * 对话节点映射（按 ID）
 */
export const dialogNodesById: Record<string, DialogNode> = {};
for (const script of allDialogScripts) {
    for (const node of script.nodes) {
        dialogNodesById[node.id] = node;
    }
}

/**
 * 根据 ID 获取对话脚本
 */
export function getDialogScriptById(id: string): DialogScript | undefined {
    return dialogScriptsById[id];
}

/**
 * 根据 ID 获取对话节点
 */
export function getDialogNodeById(id: string): DialogNode | undefined {
    return dialogNodesById[id];
}

/**
 * 获取阶段的所有对话脚本
 */
export function getDialogScriptsByPhase(phase: GamePhase): DialogScript[] {
    return allDialogScripts.filter(s => s.phase === phase);
}

/**
 * 获取阶段的起始对话脚本
 */
export function getPhaseStartDialog(phase: GamePhase): DialogScript | undefined {
    const scripts = getDialogScriptsByPhase(phase);
    return scripts[0];
}

// 导出各阶段对话
export {
    planningDialogs,
    bookingDialogs,
    departureDialogs,
    travelingDialogs,
    destinationDialogs,
    returnDialogs,
    homeDialogs,
};
