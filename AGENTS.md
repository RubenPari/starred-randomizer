# AGENTS.md - Starred Randomizer

## Architecture
Full-stack app: Fastify backend (port 3001) + React/Vite frontend (port 5173).
Frontend proxies `/api` requests to backend during dev via `vite.config.ts`.

## Commands

### Backend (`backend/`)
```
npm run dev      # start with ts-node-dev (auto-reload)
npm run build    # tsc compile
npm run start    # run compiled output (node dist/index.js)
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
- `CORS_ORIGIN` optional, defaults to `http://localhost:5173`
- `JWT_SECRET` optional, used for signing JWT tokens (default: dev-secret-change-in-production)
- `starred.db` SQLite database created automatically on first run

## Key Files

### Backend
| Path | Role |
|---|---|
| `backend/src/index.ts` | Entry point — server setup, CORS, graceful shutdown, health check |
| `backend/src/config.ts` | Environment config and constants |
| `backend/src/types.ts` | Shared TypeScript types (Repo, API responses) |
| `backend/src/services/github.ts` | GitHub API client with caching, timeouts, pagination |
| `backend/src/routes/starred.ts` | `/api/starred/:username` route handler |
| `backend/src/routes/random.ts` | `/api/random/:username` route handler |
| `backend/src/utils/validation.ts` | GitHub username validation |
| `backend/src/utils/errors.ts` | GitHub API error message mapping |
| `backend/src/utils/filters.ts` | Repo filtering logic (shared with frontend) |
| `backend/src/utils/hidden-gems.ts` | Hidden gems scoring algorithm |
| `backend/src/routes/hidden-gems.ts` | `/api/hidden-gems/:username` route handler |
| `backend/src/routes/search.ts` | `/api/search/:username` route handler |
| `backend/src/routes/stats.ts` | `/api/stats/:username` route handler |
| `backend/src/routes/favorites.ts` | `/api/favorites` CRUD (protected) |
| `backend/src/plugins/auth.ts` | Auth plugin: SQLite init, JWT, cookies, /api/auth/* routes |

### Frontend
| Path | Role |
|---|---|
| `frontend/src/App.tsx` | Main component — orchestrates hooks and components |
| `frontend/src/main.tsx` | Entry point — wraps app in ErrorBoundary + AuthProvider |
| `frontend/src/contexts/AuthContext.tsx` | Auth state management (login, register, logout) |
| `frontend/src/hooks/useStarredRepos.ts` | Custom hook for fetching starred repos |
| `frontend/src/hooks/useRandomRepo.ts` | Custom hook for random repo + history |
| `frontend/src/hooks/useFavorites.ts` | Favorites: API when auth, localStorage fallback |
| `frontend/src/hooks/useTheme.ts` | Dark mode toggle with localStorage |
| `frontend/src/components/` | Reusable components (Header, FilterPanel, ResultCard, HistoryPanel, ShuffleAnimation, SearchPanel, HiddenGems, FavoritesPanel, StatsDashboard, TimelineHeatmap, AuthModal, UserMenu, ErrorBoundary, Icons, LanguageBadge, SkeletonCard, StatisticsPanel) |
| `frontend/src/utils/format.ts` | Utility functions (formatStars, timeAgo, handleApiError) |
| `frontend/src/types.ts` | Frontend types (Repo, HistoryEntry, HiddenGemScore, RepoStats) |
| `frontend/src/index.css` | Tailwind v4 + custom CSS vars for theming (light/dark) |

## API Endpoints
- `GET /api/health` — health check with cache stats
- `POST /api/auth/register` — create account
- `POST /api/auth/login` — login, sets httpOnly cookie
- `POST /api/auth/logout` — logout, clears cookie
- `GET /api/auth/me` — get current user
- `GET /api/starred/:username` — returns all starred repos (paginated, cached)
- `GET /api/random/:username?language=&min_stars=` — returns one random repo matching filters
- `GET /api/hidden-gems/:username?limit=` — returns underrated repos (scored, <100 stars)
- `GET /api/search/:username?q=&language=&min_stars=&limit=` — full-text search across starred
- `GET /api/stats/:username` — aggregated statistics (languages, activity, topics)
- `GET /api/favorites` — user favorites (protected)
- `POST /api/favorites` — add favorite (protected)
- `DELETE /api/favorites/:fullName` — remove favorite (protected)

## Backend Features
- Full pagination (no page limit beyond `maxPages: 20` in config)
- In-memory caching with 5-minute TTL
- Request timeout (15s default)
- CORS restricted to `CORS_ORIGIN` env var (default: `http://localhost:5173`) with credentials
- Graceful shutdown on SIGTERM/SIGINT
- SQLite database for users and favorites
- JWT authentication via httpOnly cookies
- argon2 password hashing

## Frontend Conventions
- Username configurable via UI input (default: `RubenPari`)
- All UI text is in Italian
- Dark mode persists to `localStorage` key `theme`
- Theme pre-applied in `index.html` via inline script to prevent flash
- Tailwind v4 via `@tailwindcss/vite` plugin — uses `@import "tailwindcss"` and `@theme` block
- Custom CSS variables in `index.css` map to Tailwind tokens

## Build & Lint Order
```
frontend: tsc -b && vite build  (typecheck happens in build)
frontend: eslint .              (lint)
backend: tsc                    (typecheck)
```
No test framework configured. No formatter configured beyond ESLint defaults.
