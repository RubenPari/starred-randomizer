# AGENTS.md - Starred Randomizer

## Architecture
Full-stack app: Fastify backend (port 3001) + React/Vite frontend (port 5173).
Frontend proxies `/api` requests to backend during dev via `vite.config.ts`.

## Commands

### Backend (`backend/`)
```
npm run dev        # start with tsx watch (ESM, auto-reload)
npm run build      # tsc compile
npm run start      # run compiled output (node dist/index.js)
npm run typecheck  # tsc --noEmit
npm run migrate:auth # explicit schema/legacy-account migration (run build first)
npm test           # build + Node test runner; isolated PostgreSQL via PGlite
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
- No `.env` committed — use `.env.example` as reference
- `CORS_ORIGIN` optional, defaults to `http://localhost:5173`
- Node.js 22.12+ required; Docker uses Node.js 24
- `BETTER_AUTH_SECRET` required in production, at least 32 high-entropy characters
- `BETTER_AUTH_URL` must be the public HTTPS origin in production
- `TRUST_PROXY_HOPS` defaults to 0; set only to the verified fixed trusted-proxy count before a proxied deployment (see `GCP_DEPLOY.md`)
- PostgreSQL 15+ required — run the explicit migration before starting the server
- Before changing auth/schema/deployment, read the migration and rollback section in `README.md`; legacy account migration must not run implicitly at startup
- See `.env.example` for all available variables

## Key Files

### Backend
| Path | Role |
|---|---|
| `backend/src/index.ts` | Entry point — server setup, CORS, graceful shutdown, health check |
| `backend/src/config.ts` | Environment config, constants, production secret/URL validation |
| `backend/src/types.ts` | Shared TypeScript types (Repo, API responses) |
| `backend/src/services/github.ts` | GitHub API client with caching, timeouts, pagination |
| `backend/src/routes/starred.ts` | `/api/starred/:username` route handler |
| `backend/src/routes/random.ts` | `/api/random/:username` route handler |
| `backend/src/utils/validation.ts` | GitHub username validation |
| `backend/src/utils/errors.ts` | GitHub API error message mapping |
| `backend/src/utils/filters.ts` | Repo filtering logic (shared with frontend via types) |
| `backend/src/utils/hidden-gems.ts` | Hidden gems scoring algorithm |
| `backend/src/utils/user-token.ts` | Shared utility for fetching user's GitHub token |
| `backend/src/utils/validate-and-fetch.ts` | Shared validation + fetch helper used by all routes |
| `backend/src/routes/hidden-gems.ts` | `/api/hidden-gems/:username` route handler |
| `backend/src/routes/search.ts` | `/api/search/:username` route handler |
| `backend/src/routes/stats.ts` | `/api/stats/:username` route handler |
| `backend/src/routes/favorites.ts` | `/api/favorites` CRUD (protected) |
| `backend/src/plugins/auth.ts` | Fastify bridge, session identity, route authorization and custom Origin checks |
| `backend/src/auth.ts` | Better Auth configuration, Argon2, schema mapping and database sessions |
| `backend/src/auth-migration.ts` | Atomic, idempotent legacy migration; preserves user IDs, passwords, favorites and API tokens |
| `backend/src/database.ts` | Shared pool configuration, including DB_POOL_MAX |

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
| `frontend/src/components/` | Reusable components (Header, FilterPanel, ResultCard, HistoryPanel, ShuffleAnimation, SearchPanel, TopicMultiSelect, HiddenGems, FavoritesPanel, StatsDashboard, TimelineHeatmap, AuthModal, SettingsPanel, ErrorBoundary, Icons, LanguageBadge, SkeletonCard, StatisticsPanel) |
| `frontend/src/utils/format.ts` | Utility functions (formatStars, timeAgo, handleApiError) |
| `frontend/src/types.ts` | Frontend types (Repo, HistoryEntry, HiddenGemScore, RepoStats) |
| `frontend/src/index.css` | Tailwind v4 + custom CSS vars for theming (light/dark) |

## API Endpoints
- `GET /api/health` — health check with cache stats
- `POST /api/auth/sign-up/email` — create account
- `POST /api/auth/sign-in/email` — login, sets httpOnly cookie
- `POST /api/auth/sign-out` — logout, revokes session
- `GET /api/auth/get-session` — get current session and user
- `PUT /api/auth/me/token` — update GitHub token
- `GET /api/starred/:username` — returns all starred repos (paginated, cached)
- `GET /api/random/:username?language=&min_stars=&topics=` — returns one random repo matching filters (`topics` comma-separated, matches ANY; legacy `topic=` still accepted)
- `GET /api/hidden-gems/:username?limit=` — returns underrated repos (scored, <100 stars)
- `GET /api/search/:username?q=&language=&min_stars=&topics=&limit=` — full-text search across starred
- `GET /api/stats/:username` — aggregated statistics (languages, activity, topics)
- `GET /api/favorites` — user favorites (protected)
- `POST /api/favorites` — add favorite (protected)
- `DELETE /api/favorites/*fullName` — remove favorite (protected, fullName is URL-encoded)

## Backend Features
- Full pagination (no page limit beyond `maxPages: 20` in config)
- In-memory caching with 5-minute TTL (partial fetches NOT cached)
- Request timeout (15s default)
- CORS restricted to `CORS_ORIGIN` env var (default: `http://localhost:5173`) with credentials
- Graceful shutdown on SIGTERM/SIGINT
- PostgreSQL database for users, favorites and Better Auth sessions (explicit migration)
- Better Auth authentication via httpOnly cookies; protected writes also require a trusted Origin
- argon2 password hashing
- Fastify logger used throughout (no console.log)
- Shared `validateAndFetch` helper for username validation + fetch + error handling
- Shared `getUserToken` utility for fetching per-user GitHub tokens
- `safeParseInt` for NaN-safe query parameter parsing
- Configurable limits (hidden gems max stars, default/max limits, etc.) in `config.ts`

## Frontend Conventions
- Username configurable via UI input (default: `RubenPari`)
- All UI text is in Italian
- Dark mode persists to `localStorage` key `theme`
- Theme pre-applied in `index.html` via inline script to prevent flash
- Tailwind v4 via `@tailwindcss/vite` plugin — uses `@import "tailwindcss"` and `@theme` block
- Custom CSS variables in `index.css` map to Tailwind tokens
- All icons forward `style` and `className` props via `spreadProps`
- Error handling uses shared `handleApiError` from `utils/format.ts`
- `HistoryEntry` type defined once in `types.ts`, imported everywhere

## Build & Lint Order
```
frontend: tsc -b && vite build  (typecheck happens in build)
frontend: eslint .              (lint)
backend: tsc --noEmit           (typecheck only)
backend: tsc                    (typecheck + emit)
```
Backend tests use Node's built-in test runner and ephemeral PGlite PostgreSQL; they skip `.env` and never connect to the configured app database. No frontend test framework or formatter configured beyond ESLint defaults.
