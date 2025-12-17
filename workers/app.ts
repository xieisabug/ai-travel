import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import worldApi from "./world-api";

const app = new Hono();

// 挂载 World API 路由
app.route("/api", worldApi);

export default app;
