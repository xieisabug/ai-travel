# AI 虚拟旅游系统 - 开发文档

## 系统概述

本系统实现了一个由 AI 驱动的虚拟旅游体验，包含以下核心功能：

1. **AI 生成虚拟世界** - 生成不存在的幻想世界，包含风土人情、文化特色等
2. **旅游项目系统** - 基于世界生成多个可选的旅游项目
3. **景点和 NPC 生成** - 当玩家选择项目后，生成详细的景点、故事和 NPC
4. **图片生成** - 为世界、景点、NPC 生成配图
5. **游览动线** - 串联景点形成完整的游览路线
6. **启程和回程机制** - 控制旅游节奏和冷却时间

## 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    前端 (React Router)                    │
├─────────────────────────────────────────────────────────┤
│                    Worker API (/api)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ /worlds     │  │ /projects   │  │ /sessions   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
├─────────────────────────────────────────────────────────┤
│                  WorldGenerationService                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ ai_generate │  │ image_gen   │  │ 动线管理     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
├─────────────────────────────────────────────────────────┤
│                    Cloudflare 服务                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │     KV      │  │     R2      │  │  Workers AI │     │
│  │ (数据存储)  │  │ (图片存储)  │  │ (AI 推理)   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## 核心文件说明

### 类型定义

- [app/types/world.ts](app/types/world.ts) - 世界、旅游项目、景点、NPC 等核心类型

### AI 生成服务

- [app/lib/ai/generate.ts](app/lib/ai/generate.ts) - `ai_generate` 函数封装，使用 OpenAI API
- [app/lib/ai/image-generate.ts](app/lib/ai/image-generate.ts) - `image_generate` 函数封装（留空待实现）
- [app/lib/ai/world-service.ts](app/lib/ai/world-service.ts) - 世界生成服务，整合文本和图片生成

### 存储服务

- [app/lib/storage/cloudflare-kv.ts](app/lib/storage/cloudflare-kv.ts) - Cloudflare KV 存储提供者

### Worker API

- [workers/world-api.ts](workers/world-api.ts) - 世界生成相关的 API 路由

## API 接口

### 世界相关

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/worlds` | 获取所有世界列表 |
| GET | `/api/worlds/:id` | 获取单个世界详情 |
| POST | `/api/worlds/generate` | 生成新世界 |
| DELETE | `/api/worlds/:id` | 删除世界 |

### 项目相关

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/projects/:id` | 获取项目详情 |
| POST | `/api/projects/:id/generate` | 生成项目详情（景点、NPC 等） |

### 会话相关

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/sessions` | 创建旅游会话 |
| GET | `/api/sessions/:id` | 获取会话详情 |
| GET | `/api/sessions/player/:playerId` | 获取玩家所有会话 |
| POST | `/api/sessions/:id/next` | 前往下一个景点 |
| POST | `/api/sessions/:id/complete` | 完成旅游 |
| POST | `/api/sessions/:id/memories` | 添加回忆 |

## 使用流程

### 1. 生成世界

```typescript
// POST /api/worlds/generate
const response = await fetch('/api/worlds/generate', {
    method: 'POST',
    body: JSON.stringify({
        theme: '蒸汽朋克' // 可选的主题提示
    })
});

const { data: world } = await response.json();
// world 包含:
// - name: 世界名称
// - description: 世界描述
// - geography, climate, culture 等风土人情
// - travelProjects: 可选的旅游项目列表
```

### 2. 选择项目并生成详情

```typescript
// 当玩家选择某个项目时
// POST /api/projects/:projectId/generate
const response = await fetch(`/api/projects/${projectId}/generate`, {
    method: 'POST'
});

const { data: project } = await response.json();
// project 现在包含:
// - spots: 景点列表（每个景点有 story, npcs 等）
// - tourRoute: 游览顺序
```

### 3. 开始旅游

```typescript
// POST /api/sessions
const response = await fetch('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({
        playerId: 'player_123',
        worldId: world.id,
        projectId: project.id
    })
});

const { data: session } = await response.json();
// session.status: 'departing' - 等待启程
```

### 4. 游览景点

```typescript
// 前往下一个景点
// POST /api/sessions/:sessionId/next
const response = await fetch(`/api/sessions/${session.id}/next`, {
    method: 'POST'
});

const { data: updatedSession } = await response.json();
// updatedSession.currentSpotId: 当前景点 ID
// updatedSession.progress: 游览进度 (0-100%)
```

### 5. 完成旅游

```typescript
// 当 session.status 为 'returning' 时
// POST /api/sessions/:sessionId/complete
const response = await fetch(`/api/sessions/${session.id}/complete`, {
    method: 'POST'
});
// session.status 变为 'completed'
// 进入冷却期，防止频繁旅游
```

## 配置说明

### wrangler.jsonc 配置

```jsonc
{
    // KV 命名空间 - 需要先创建
    // 运行: wrangler kv:namespace create "AI_TRAVEL_KV"
    "kv_namespaces": [
        {
            "binding": "AI_TRAVEL_KV",
            "id": "YOUR_KV_NAMESPACE_ID"  // 替换为实际 ID
        }
    ]
}
```

### 环境变量/Secrets

```bash
# 设置 OpenAI API Key
wrangler secret put OPENAI_API_KEY

# 可选：自定义 API 端点
# wrangler secret put OPENAI_BASE_URL
```

## 实现图片生成

图片生成函数 `image_generate` 已预留接口，需要你实现具体逻辑。

位置: [app/lib/ai/image-generate.ts](app/lib/ai/image-generate.ts)

可选的实现方式：

### 1. Cloudflare Workers AI

```typescript
// 在 image_generate 函数中
export async function image_generate(
    prompt: string,
    config: ImageGenerateConfig,
    options: ImageGenerateOptions = {}
): Promise<ImageGenerateResult> {
    const { width = 1024, height = 768 } = options;

    // 使用 Cloudflare Workers AI
    const response = await env.AI.run(
        '@cf/stabilityai/stable-diffusion-xl-base-1.0',
        { prompt, width, height }
    );

    // 保存到 R2
    const imageKey = `images/${Date.now()}.png`;
    await env.BUCKET.put(imageKey, response);

    return {
        success: true,
        url: `${config.cdnBaseUrl}/${imageKey}`,
        prompt,
    };
}
```

### 2. 其他图片生成服务

支持任何返回图片的 API，只需在 `image_generate` 函数中实现调用逻辑。

## 并发生成

系统已实现并发生成以提高效率：

- 多个旅游项目的封面图并发生成
- 多个景点的 NPC 并发生成
- 所有景点图片和 NPC 立绘并发生成

代码示例（来自 world-service.ts）：

```typescript
// 并发生成所有图片
private async generateAllImagesAsync(spots: Spot[], world: World): Promise<void> {
    const allTasks: Promise<void>[] = [];

    for (const spot of spots) {
        // 景点图片
        allTasks.push(this.generateSpotImage(spot, world));
        
        // NPC 立绘
        for (const npc of spot.npcs) {
            allTasks.push(this.generateNpcPortrait(npc));
        }
    }

    await Promise.all(allTasks);
}
```

## 时间控制

- **启程等待时间**: 默认 30 秒，用于生成内容
- **冷却时间**: 默认 1 分钟，防止频繁旅游

可在创建 WorldGenerationService 时配置：

```typescript
const service = new WorldGenerationService({
    ai: { apiKey: '...' },
    image: {},
    departureWaitTime: 60000,  // 1分钟
    cooldownTime: 300000,      // 5分钟
});
```

## 下一步开发建议

1. **实现图片生成** - 在 `image_generate` 中接入实际的图片生成服务
2. **前端界面** - 开发世界浏览、项目选择、游览界面
3. **对话系统** - 扩展 NPC 对话生成，接入现有的对话系统
4. **成就系统** - 基于游览记录实现成就解锁
5. **社交功能** - 多人同时选择同一项目的互动
