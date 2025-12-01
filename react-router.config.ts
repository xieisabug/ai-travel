import type { Config } from "@react-router/dev/config";

export default {
  // 使用 SPA 模式，避免 SSR 的 ESM/CJS 兼容问题
  ssr: false,
} satisfies Config;
