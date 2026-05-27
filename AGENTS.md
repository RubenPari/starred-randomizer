# AGENTS.md - Starred Randomizer

## Architecture
Full-stack app: Fastify backend (port 3001) + React/Vite frontend (port 5173).
Frontend proxies `/api` requests to backend during dev via `vite.config.ts`.

## Commands

### Backend (`backend/`)
```
npm run dev      # start with ts-node-dev (auto-reload)
npm run build    # tsc compile
```

### Frontend (`frontend/`)
```
npm run dev      # Vite dev server (proxies /api → localhost:3001)
npm run build    # tsc -b && vite build
npm run lint     # ESLint
npm run preview  # vite preview (prod build)
```

### Dev order: start backend first, then frontend. Both must run for the app to work.

## Environment
- `GITHUB_TOKEN` required in `.env` at repo root (backend loads it via `path.resolve(process.cwd(), '../.env')`)
- Backend reads `.env` from parent directory, not from `backend/.env`
- No `.env` committed — use `backend/.env` template as reference

## Key Files
| Path | Role |
|---|---|
| `backend/src/index.ts` | Single-file Fastify server — 2 API endpoints |
| `frontend/src/App.tsx` | Main React component — all UI logic |
| `frontend/src/components/` | Reusable components (Icons, LanguageBadge, SkeletonCard, StatisticsPanel) |
| `frontend/src/index.css` | Tailwind v4 + custom CSS vars for theming (light/dark) |

## API Endpoints
- `GET /api/starred/:username` — returns all starred repos (page 1, 100 per page)
- `GET /api/random/:username?language=&min_stars=` — returns one random repo matching filters

## Backend Limitations
- Only fetches page 1 (max 100 repos) — pagination beyond that is not implemented
- CORS set to `origin: '*'` — open to all origins

## Frontend Conventions
- Username `RubenPari` is hardcoded in `App.tsx` — not user-configurable via UI
- All UI text is in Italian
- Dark mode persists to `localStorage` key `theme`
- Theme pre-applied in `index.html` via inline script to prevent flash
- Tailwind v4 via `@tailwindcss/vite` plugin — uses `@import "tailwindcss"` and `@theme` block
- Custom CSS variables in `index.css` map to Tailwind tokens (`--color-brand`, `--color-surface`, etc.)

## Build & Lint Order
```
frontend: tsc -b && vite build  (typecheck happens in build)
frontend: eslint .              (lint)
```
No test framework configured. No formatter configured beyond ESLint defaults.
