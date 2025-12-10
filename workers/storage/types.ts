/**
 * 存储提供者类型定义
 */

import type { World, TravelProject, TravelVehicle, Spot, SpotNPC, TravelSession, DialogScript, DialogScriptType } from '../../app/types/world';
import type { User, UserSession, UserListParams, PublicUser } from '../../app/types/user';
import type { CurrencyTransaction, CurrencyTransactionType, DailyClaimResult } from '../../app/types/currency';

/**
 * 存储配置
 */
export interface StorageConfig {
    version?: number;
    prefix?: string;
}

/**
 * AI 调用类型
 */
export type AICallType =
    | 'generate_world'
    | 'generate_vehicle'
    | 'generate_projects'
    | 'generate_spots'
    | 'generate_world_npc'
    | 'generate_npc'
    | 'generate_dialog'
    | 'generate_text'
    | 'image_world_cover'
    | 'image_world_overview'
    | 'image_world_culture'
    | 'image_project_cover'
    | 'image_spot'
    | 'image_npc_portrait'
    | 'image_vehicle';

/**
 * AI 调用记录
 */
export interface AICallRecord {
    /** 记录 ID */
    id: string;
    /** 调用类型 */
    type: AICallType;
    /** 关联的世界 ID */
    worldId?: string;
    /** 关联的项目 ID */
    projectId?: string;
    /** 关联的景点 ID */
    spotId?: string;
    /** 关联的 NPC ID */
    npcId?: string;
    /** 发送的 prompt */
    prompt: string;
    /** 返回的 response（图片类型为 URL） */
    response?: string;
    /** 是否成功 */
    success: boolean;
    /** 错误信息 */
    error?: string;
    /** 使用的模型 */
    model?: string;
    /** token 使用量 */
    tokenUsage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    /** 耗时（毫秒） */
    duration: number;
    /** 重试次数 */
    retryCount: number;
    /** 创建时间 */
    createdAt: string;
}

/**
 * AI 调用记录查询参数
 */
export interface AICallQueryParams {
    type?: AICallType;
    worldId?: string;
    projectId?: string;
    success?: boolean;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

/**
 * AI 调用统计
 */
export interface AICallStats {
    totalCalls: number;
    successCalls: number;
    failedCalls: number;
    totalTokens: number;
    totalDuration: number;
    avgDuration: number;
    byType: Record<AICallType, {
        count: number;
        success: number;
        failed: number;
        avgDuration: number;
    }>;
}

/**
 * 导出数据格式
 */
export interface ExportData {
    version: number;
    exportedAt: string;
    settings: Record<string, unknown>;
    worlds: World[];
    projects?: TravelProject[];
    vehicles?: TravelVehicle[];
    spots?: Spot[];
    npcs?: SpotNPC[];
    sessions?: TravelSession[];
    aiCalls?: AICallRecord[];
    dialogScripts?: DialogScript[];
}

/**
 * 存储提供者接口
 */
export interface IStorageProvider {
    // 设置操作
    getSetting<T>(key: string): Promise<T | null>;
    setSetting<T>(key: string, value: T): Promise<void>;

    // 世界数据操作
    getWorld(id: string): Promise<World | null>;
    getAllWorlds(): Promise<World[]>;
    saveWorld(world: World): Promise<void>;
    deleteWorld(id: string): Promise<void>;

    // 旅行器操作
    getVehicle(id: string): Promise<TravelVehicle | null>;
    getVehicleByWorldId(worldId: string): Promise<TravelVehicle | null>;
    saveVehicle(vehicle: TravelVehicle, worldId: string): Promise<void>;

    // 旅游项目操作
    getProject(id: string): Promise<TravelProject | null>;
    getProjectsByWorldId(worldId: string): Promise<TravelProject[]>;
    saveProject(project: TravelProject): Promise<void>;

    // 景点操作
    getSpot(id: string): Promise<Spot | null>;
    getSpotsByProjectId(projectId: string): Promise<Spot[]>;
    saveSpot(spot: Spot): Promise<void>;

    // NPC 操作
    getNPC(id: string): Promise<SpotNPC | null>;
    getNPCsBySpotId(spotId: string): Promise<SpotNPC[]>;
    getNPCsByWorldId(worldId: string): Promise<SpotNPC[]>;
    getNPCsByIds(ids: string[]): Promise<SpotNPC[]>;
    getAllNPCs(params?: { limit?: number; offset?: number }): Promise<{ npcs: SpotNPC[]; total: number }>;
    saveNPC(npc: SpotNPC, worldId: string): Promise<void>;
    deleteNPC(id: string): Promise<void>;

    // 对话脚本操作
    getDialogScript(id: string): Promise<DialogScript | null>;
    getDialogScripts(params?: {
        npcId?: string;
        spotId?: string;
        type?: DialogScriptType;
        isActive?: boolean;
        limit?: number;
    }): Promise<DialogScript[]>;
    saveDialogScript(script: DialogScript): Promise<void>;
    deleteDialogScript(id: string): Promise<void>;

    // 旅游会话操作
    getSession(id: string): Promise<TravelSession | null>;
    getPlayerSessions(playerId: string): Promise<TravelSession[]>;
    saveSession(session: TravelSession): Promise<void>;
    getLatestPlayerSession(playerId: string): Promise<TravelSession | null>;

    // AI 调用记录操作
    saveAICall(record: AICallRecord): Promise<void>;
    getAICall(id: string): Promise<AICallRecord | null>;
    getAICalls(params?: AICallQueryParams): Promise<AICallRecord[]>;
    getAICallStats(params?: AICallQueryParams): Promise<AICallStats>;

    // 用户操作
    getUser(id: string): Promise<User | null>;
    getUserByUsername(username: string): Promise<User | null>;
    getUserByEmail(email: string): Promise<User | null>;
    getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | null>;
    getAllUsers(params?: UserListParams): Promise<{ users: PublicUser[]; total: number }>;
    saveUser(user: User): Promise<void>;
    deleteUser(id: string): Promise<void>;
    updateUserStats(userId: string, worldGenCount: number, resetDate: string): Promise<void>;

    // 货币操作
    /** 领取每日登录奖励 */
    claimDailyBonus(userId: string): Promise<DailyClaimResult>;
    /** 更新用户货币余额 (创建交易记录) */
    updateCurrencyBalance(
        userId: string,
        amount: number,
        type: CurrencyTransactionType,
        description: string,
        referenceId?: string,
        referenceType?: 'world' | 'session' | 'item'
    ): Promise<{ newBalance: number; transaction: CurrencyTransaction }>;
    /** 获取用户交易记录 */
    getCurrencyTransactions(
        userId: string,
        limit?: number,
        offset?: number
    ): Promise<{ transactions: CurrencyTransaction[]; total: number }>;

    // 用户会话操作
    getUserSession(id: string): Promise<UserSession | null>;
    getUserSessionByToken(token: string): Promise<UserSession | null>;
    saveUserSession(session: UserSession): Promise<void>;
    deleteUserSession(id: string): Promise<void>;
    deleteUserSessionsByUserId(userId: string): Promise<void>;
    cleanExpiredSessions(): Promise<void>;

    // 工具方法
    clear(): Promise<void>;
    export(): Promise<string>;
    import(data: string): Promise<void>;
    isAvailable(): Promise<boolean>;
}
