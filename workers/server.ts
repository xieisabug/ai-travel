/**
 * Node.js 后端服务器入口
 * 
 * 使用 Hono + @hono/node-server 运行
 * 提供 API 服务，前端通过代理访问
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import dotenv from 'dotenv';
import worldApi from './world-api-node';

// 加载环境变量
dotenv.config();

const app = new Hono();

// 中间件
app.use('*', logger());
app.use('*', cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
}));

// 全局错误处理
app.onError((err, c) => {
    console.error('═══════════════════════════════════════════');
    console.error('❌ API Error:');
    console.error('  Path:', c.req.path);
    console.error('  Method:', c.req.method);
    console.error('  Message:', err.message);
    console.error('  Stack:', err.stack);
    console.error('═══════════════════════════════════════════');

    return c.json({
        error: err.message,
        path: c.req.path,
    }, 500);
});

// 挂载 World API 路由
app.route('/api', worldApi);

// 健康检查
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        message: 'AI Travel API Server is running',
        timestamp: new Date().toISOString(),
    });
});

// 启动服务器
const port = parseInt(process.env.API_PORT || '3001', 10);

console.log(`
╔══════════════════════════════════════════════╗
║          AI Travel API Server                 ║
╠══════════════════════════════════════════════╣
║  🚀 Server running at http://localhost:${port}   ║
║  📚 API endpoints at /api/*                   ║
║  💾 Using SQLite (sql.js) for storage         ║
╚══════════════════════════════════════════════╝
`);

serve({
    fetch: app.fetch,
    port,
});
