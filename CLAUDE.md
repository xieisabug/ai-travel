# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Virtual Travel Game - A Galgame-style virtual travel experience where AI generates fantasy worlds, travel vehicles, tourist projects, scenic spots, and NPCs. Users can explore these AI-generated worlds in an interactive travel experience.

## Development Commands

```bash
# Start development (runs both frontend and API server concurrently)
npm run dev

# Start only the API server (port 3001)
npm run dev:api

# Start only the frontend (port 5173)
npm run dev:web

# Type checking
npm run typecheck

# Build for production
npm run build
```

## Architecture

### Frontend (React + Vite)

- **Entry Point**: `app/main.tsx` - Routes are defined here using React Router DOM (NOT in routes.ts)
- **Pages**: `app/routes/` - Each .tsx file is a page component
  - `home.tsx` - Landing page
  - `worlds.tsx` - World browsing and generation
  - `world-game.tsx` - Game play interface
  - `admin/worlds.tsx` - Admin panel for world management
- **Components**: `app/components/` - Reusable components (e.g., AuthModal)
- **Hooks**: `app/hooks/` - Custom React hooks
  - `useAuth.tsx` - Authentication context and hooks
  - `useWorlds.ts` - World data management
- **Types**: `app/types/` - TypeScript type definitions
  - `world.ts` - World, TravelProject, Spot, SpotNPC types
  - `user.ts` - User and authentication types
- **Styling**: Tailwind CSS 4.x with custom classes in `app/app.css`

### Backend (Hono on Node.js)

- **Entry Point**: `workers/server.ts` - Hono server setup
- **API Routes**: `workers/world-api-node.ts` - All API endpoints mounted at `/api/*`
- **Authentication**: `workers/auth.ts` - Auth middleware and utilities
- **Task Queue**: `workers/task-queue.ts` - Async task management for long-running operations
- **Storage**: `workers/storage/` - Data persistence layer
  - `types.ts` - IStorageProvider interface
  - `sqlite.ts` - SQLite implementation using sql.js (in-memory)

### AI Services (`app/lib/ai/`)

- `generate.ts` - AI text generation using OpenAI API
- `image-generate.ts` - AI image generation
- `world-service.ts` - World generation orchestration
- `ai-call-recorder.ts` - Logging AI API calls

## Key Patterns

### API Response Formats

Different endpoints use different response formats:
- `/api/worlds` returns `{ worlds: [...] }` (no `success` field)
- `/api/worlds/:id` returns the world object directly
- `/api/worlds/generate` returns `{ taskId: "..." }` for async task polling
- Admin endpoints (`/api/admin/*`) return `{ success: true/false, ... }`

### Async Task Pattern

Long-running operations (world generation) use task queue:
1. POST creates task, returns `{ taskId }`
2. GET `/api/tasks/:taskId` polls status
3. Status: `pending` → `running` → `completed`/`failed`

### Authentication

- JWT tokens stored in cookies
- `useAuthContext()` hook provides auth state
- Admin routes check `user?.role === 'admin'`
- sql.js runs in-memory; restart backend to reload database changes

## Environment Variables

Copy `.env.example` to `.env`:
```
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://api.openai.com/v1  # optional
OPENAI_MODEL=gpt-4o-mini                    # optional
API_PORT=3001                               # optional
```

## Important Notes

- The `routes.ts` file is for Cloudflare Workers deployment only - development uses `main.tsx`
- Frontend proxies `/api/*` requests to the backend (configured in `vite.config.ts`)
- Database is SQLite via sql.js, running in memory - data persists to file but requires server restart to see external changes
