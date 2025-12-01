import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import worldApi from "./world-api";

const app = new Hono();

// 挂载 World API 路由
app.route('/api', worldApi);

// 处理 React Router 请求
app.get("*", (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );

  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
  });
});

export default app;
