/**
 * Cloudflare Worker 环境类型扩展
 * 
 * 扩展默认的 Env 接口，添加自定义的绑定
 */

import type { KVNamespace } from './app/lib/storage/cloudflare-kv';

declare global {
    namespace Cloudflare {
        interface Env {
            /** KV 命名空间 - 存储世界、项目、会话等数据 */
            AI_TRAVEL_KV: KVNamespace;
            /** OpenAI API Key (secret) */
            OPENAI_API_KEY?: string;
            /** OpenAI API Base URL */
            OPENAI_BASE_URL?: string;
            /** OpenAI 模型名称 */
            OPENAI_MODEL?: string;
        }
    }
}

export { };
