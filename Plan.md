# AI 虚拟旅游 - Galgame 风格项目计划

## 📋 项目概述

一个基于 AI 生成内容的虚拟旅游体验游戏，采用 Galgame（视觉小说）风格。玩家将经历从规划行程、购买机票到旅游归家的完整旅程，所有景点和图像均为 AI 生成的虚拟内容。

### 技术栈
- **前端框架**: React 19 + React Router 7 (SSR)
- **后端**: Hono + Cloudflare Workers
- **样式**: Tailwind CSS 4
- **构建工具**: Vite 6
- **类型系统**: TypeScript 5.8

---

## 🎮 游戏阶段设计

游戏共分为 **7 个核心阶段**，每个阶段有独特的场景和交互：

| 阶段 | 标识 | 名称 | 核心体验 | 主要交互 |
|------|------|------|----------|----------|
| 1 | `planning` | 规划行程 | 浏览虚拟目的地，选择想去的地方 | 目的地卡片选择、对话介绍 |
| 2 | `booking` | 购买机票 | 选择航班、座位，完成购票流程 | 航班列表、座位图、支付确认 |
| 3 | `departure` | 出发日 | 收拾行李、前往机场、办理登机 | 物品选择、场景切换、NPC 对话 |
| 4 | `traveling` | 旅途中 | 飞行体验、邻座交流、俯瞰云海 | 窗外风景互动、邻座对话选项 |
| 5 | `destination` | 目的地探索 | 游览多个景点、与 NPC 互动 | 景点热点、拍照、收集回忆 |
| 6 | `return` | 返程 | 告别目的地、购买纪念品、返航 | 纪念品商店、告别对话 |
| 7 | `home` | 归家总结 | 回顾旅程、整理照片、生成游记 | 相册浏览、成就解锁、游记生成 |

---

## 📁 项目结构

```
app/
├── components/
│   ├── game/                    # 游戏核心组件
│   │   ├── DialogBox.tsx        # 对话框（打字机效果）
│   │   ├── ChoiceMenu.tsx       # 分支选项菜单
│   │   ├── SceneView.tsx        # 场景背景渲染
│   │   ├── InteractiveLayer.tsx # 可交互热点层
│   │   ├── CharacterSprite.tsx  # 角色立绘
│   │   └── PhaseIndicator.tsx   # 阶段进度指示器
│   └── ui/                      # 通用 UI 组件
│       ├── Button.tsx
│       └── Card.tsx
│
├── data/                        # 游戏数据（Mock）
│   ├── destinations.ts          # 目的地数据
│   ├── dialogs/                 # 对话脚本
│   │   ├── planning.ts
│   │   ├── booking.ts
│   │   ├── departure.ts
│   │   ├── traveling.ts
│   │   ├── destination.ts
│   │   ├── return.ts
│   │   └── home.ts
│   ├── characters.ts            # NPC 角色数据
│   └── scenes.ts                # 场景配置
│
├── lib/
│   ├── storage/                 # 存储抽象层
│   │   ├── types.ts             # 存储接口定义
│   │   ├── local-storage.ts     # LocalStorage 实现
│   │   └── index.ts             # 导出 & 工厂函数
│   │
│   ├── ai/                      # AI 内容生成抽象层
│   │   ├── types.ts             # AI 接口定义
│   │   ├── mock-provider.ts     # Mock 实现（固定数据）
│   │   └── index.ts             # 导出 & 工厂函数
│   │
│   └── game-engine/             # 游戏引擎
│       ├── types.ts             # 引擎内部类型
│       ├── state-manager.ts     # 状态管理
│       ├── dialog-controller.ts # 对话控制器
│       └── index.ts             # 引擎主入口
│
├── hooks/                       # React Hooks
│   ├── useGameState.ts          # 游戏状态 Hook
│   ├── useDialog.ts             # 对话系统 Hook
│   └── useTypewriter.ts         # 打字机效果 Hook
│
├── types/
│   └── game.ts                  # 核心游戏类型定义
│
├── routes/
│   ├── home.tsx                 # 首页/主菜单
│   ├── game.tsx                 # 游戏主界面
│   └── saves.tsx                # 存档管理（可选）
│
└── routes.ts                    # 路由配置
```

---

## 🔧 核心类型定义

### 游戏阶段 (GamePhase)

```typescript
type GamePhase = 
  | 'planning'     // 规划行程
  | 'booking'      // 购买机票
  | 'departure'    // 出发日
  | 'traveling'    // 旅途中
  | 'destination'  // 目的地探索
  | 'return'       // 返程
  | 'home';        // 归家总结
```

### 对话节点 (DialogNode)

```typescript
interface DialogNode {
  id: string;                              // 唯一标识
  speaker: 'narrator' | 'player' | string; // 说话者（narrator=旁白，player=玩家，string=NPC名）
  text: string;                            // 对话文本（支持 AI 生成）
  emotion?: CharacterEmotion;              // 角色表情
  background?: string;                     // 背景图 URL
  characterSprite?: string;                // 角色立绘 URL
  choices?: DialogChoice[];                // 选项分支
  next?: string;                           // 下一节点 ID（无选项时）
  effects?: GameEffect[];                  // 触发的游戏效果
}

interface DialogChoice {
  id: string;
  text: string;           // 选项文本
  nextId: string;         // 跳转节点 ID
  condition?: string;     // 显示条件（可选）
  effects?: GameEffect[]; // 选择后的效果
}
```

### 场景 (Scene)

```typescript
interface Scene {
  id: string;
  phase: GamePhase;
  name: string;
  description: string;
  background: string;           // 背景图 URL（AI 生成）
  hotspots: Hotspot[];          // 可交互热点
  entryDialogId: string;        // 进入时触发的对话
  bgm?: string;                 // 背景音乐（预留）
}

interface Hotspot {
  id: string;
  x: number;                    // 位置 X (百分比)
  y: number;                    // 位置 Y (百分比)
  width: number;                // 宽度 (百分比)
  height: number;               // 高度 (百分比)
  label: string;                // 显示名称
  icon?: string;                // 图标
  type: 'dialog' | 'scene' | 'item' | 'action';
  targetId: string;             // 目标 ID（对话/场景/物品）
  condition?: string;           // 显示条件
}
```

### 游戏存档 (GameSave)

```typescript
interface GameSave {
  id: string;
  version: number;              // 存档版本号
  createdAt: string;            // ISO 日期
  updatedAt: string;
  
  // 游戏进度
  currentPhase: GamePhase;
  currentSceneId: string;
  currentDialogId?: string;
  dialogHistory: string[];      // 已读对话 ID
  
  // 玩家选择
  selectedDestination?: Destination;
  selectedFlight?: Flight;
  
  // 收集系统
  inventory: InventoryItem[];   // 背包物品
  memories: Memory[];           // 收集的回忆（照片）
  achievements: string[];       // 解锁的成就
  
  // 状态标记
  flags: Record<string, boolean | string | number>;
}
```

---

## 🔌 抽象层设计

### 存储抽象层 (IStorageProvider)

```typescript
interface IStorageProvider {
  // 存档操作
  getSave(id: string): Promise<GameSave | null>;
  getAllSaves(): Promise<GameSave[]>;
  saveSave(save: GameSave): Promise<void>;
  deleteSave(id: string): Promise<void>;
  
  // 设置操作
  getSetting<T>(key: string): Promise<T | null>;
  setSetting<T>(key: string, value: T): Promise<void>;
  
  // 工具方法
  clear(): Promise<void>;
  export(): Promise<string>;           // 导出为 JSON
  import(data: string): Promise<void>; // 从 JSON 导入
}
```

**实现计划**:
1. ✅ `LocalStorageProvider` - 浏览器本地存储（当前）
2. 🔜 `CloudflareKVProvider` - Cloudflare KV（未来）
3. 🔜 `IndexedDBProvider` - IndexedDB（大量数据场景）

### AI 内容抽象层 (IAIContentProvider)

```typescript
interface IAIContentProvider {
  // 图像生成
  generateSceneBackground(prompt: ScenePrompt): Promise<string>;      // 返回图片 URL
  generateCharacterSprite(prompt: CharacterPrompt): Promise<string>;
  generateDestinationImage(prompt: DestinationPrompt): Promise<string>;
  
  // 文本生成
  generateDialogText(context: DialogContext): Promise<string>;
  generateDestinationDescription(destination: Destination): Promise<string>;
  generateTravelJournal(memories: Memory[]): Promise<string>;
  
  // 结构化数据生成
  generateDestination(): Promise<Destination>;
  generateNPC(context: NPCContext): Promise<Character>;
}
```

**实现计划**:
1. ✅ `MockAIProvider` - 固定数据 Mock（当前）
2. 🔜 `CloudflareAIProvider` - Cloudflare Workers AI
3. 🔜 `OpenAIProvider` - OpenAI API
4. 🔜 `CustomAPIProvider` - 自定义 API 接口

---

## 🎯 实现路径

### Phase 1: 基础架构 ✅
- [x] 创建项目计划文档
- [ ] 定义核心类型 (`app/types/game.ts`)
- [ ] 实现存储抽象层
- [ ] 实现 AI 内容抽象层（Mock）

### Phase 2: 游戏数据
- [ ] 创建目的地数据
- [ ] 编写各阶段对话脚本
- [ ] 配置场景和热点

### Phase 3: 游戏引擎
- [ ] 实现状态管理器
- [ ] 实现对话控制器
- [ ] 创建游戏引擎主类

### Phase 4: UI 组件
- [ ] 实现对话框组件（打字机效果）
- [ ] 实现选项菜单组件
- [ ] 实现场景渲染组件
- [ ] 实现可交互热点层

### Phase 5: 页面集成
- [ ] 配置游戏路由
- [ ] 实现游戏主页面
- [ ] 实现主菜单页面

### Phase 6: 完善体验
- [ ] 添加过渡动画
- [ ] 实现存档系统 UI
- [ ] 优化移动端适配

---

## 🎨 UI/UX 设计参考

### 对话框样式
- 底部半透明对话框
- 左侧显示说话者名称
- 打字机逐字显示效果
- 点击或按空格继续

### 选项菜单
- 居中显示
- 鼠标悬停高亮
- 选择后有反馈动画

### 场景交互
- 可交互区域显示微弱发光提示
- 点击后触发对话或切换场景
- 支持场景内多个热点

---

## 📝 Mock 数据说明

当前阶段使用固定的 Mock 数据，格式与最终 AI 生成数据完全一致：

- **图片**: 使用 placeholder 服务（如 `https://placehold.co/`）或渐变背景
- **文本**: 预设的中文对话和描述
- **目的地**: 3-5 个虚构的幻想风格目的地

后续接入 AI API 时，只需实现新的 Provider 并替换工厂函数即可。

---

## 🚀 未来扩展

1. **多目的地支持** - 每次游戏可选择不同目的地
2. **多结局系统** - 根据选择影响旅行体验和结局
3. **成就系统** - 探索、对话、收集等多维度成就
4. **分享功能** - 生成旅行日记并分享到社交媒体
5. **BGM 系统** - 各场景配乐
6. **多语言支持** - 国际化

---

*Last Updated: 2025-11-28*
