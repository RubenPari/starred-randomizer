# GitHub Starred Randomizer

A full-stack TypeScript application that allows users to explore their GitHub starred repositories and randomly pick one based on filters.

## Features

- Fetch all starred repositories for a GitHub user
- Filter repositories by programming language and minimum star count
- Randomly select a repository from the filtered results
- Search across starred repos by name, description, topic, or language
- Hidden Gems: discover underrated repos with few stars but high potential
- Favorites: save and manage your favorite repos (authenticated users: server-side, guests: localStorage)
- Statistics dashboard with language distribution, monthly activity, and top topics
- Timeline heatmap of repository creation dates
- Dark/light theme toggle
- Email/password authentication with Better Auth and revocable database sessions
- GitHub personal access token per user for higher rate limits
- Modern UI built with React and TypeScript (Italian language)
- Fast backend API with Fastify

## Tech Stack

- **Backend**: Fastify + TypeScript
- **Frontend**: React 19 + TypeScript + Vite 7
- **Styling**: Tailwind CSS v4
- **HTTP Client**: Axios
- **Database**: PostgreSQL

## Prerequisites

- Node.js v22.12+ (Node.js 24 recommended; used by Docker)
- npm
- GitHub Personal Access Token
- PostgreSQL 15+

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/starred-randomizer.git
cd starred-randomizer
```

### 2. Environment Configuration

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
GITHUB_TOKEN=your_github_personal_access_token
PORT=3001

# PostgreSQL configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=starred_randomizer

# Better Auth: set a random secret of at least 32 characters in production
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:5173
```

### 3. Backend Setup

```bash
cd backend
npm install
```

### 4. Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Local Development

#### Start PostgreSQL

Ensure PostgreSQL is running locally and the database `starred_randomizer` exists:

```sql
CREATE DATABASE starred_randomizer;
```

#### Initialize or migrate authentication

Run this explicitly from `backend/`, before the first start of this version:

```bash
npm run build
npm run migrate:auth
```

For an existing installation, stop all old application instances and take a full database backup first. The migration preserves user IDs, email addresses, Argon2 password hashes, GitHub API tokens, and favorites. It adds Better Auth tables and user fields, moves password hashes to `auth_accounts`, then removes the old `users.password_hash` column in the same transaction. Emails remain unverified, as before. A migration ledger makes subsequent runs a no-op; later password changes are never overwritten.

The old application must not run against the migrated database. A rollback requires restoring the pre-migration database backup together with the old application, with writes stopped. Old JWT cookies are no longer accepted: every user signs in again, using the same password.

The server checks for the migration but never runs it automatically, including on an empty database. Tests use in-memory PostgreSQL (PGlite) with no access to `.env` or the configured database:

```bash
npm test
```

#### Start the Backend Server

```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:3001`

#### Start the Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Register or log in
3. Enter a GitHub username
4. Click "Carica Starred" to fetch all starred repositories
5. Optionally set filters (language, min stars)
6. Click "Estrai Random" to get a random repository

## API Endpoints

- `GET /api/health` - Health check with cache stats
- `POST /api/auth/sign-up/email` - Create account (`name`, `email`, `password`)
- `POST /api/auth/sign-in/email` - Login (sets httpOnly session cookie)
- `POST /api/auth/sign-out` - Logout and revoke the session
- `GET /api/auth/get-session` - Get current session and user
- `PUT /api/auth/me/token` - Update GitHub token
- `GET /api/starred/:username` - Fetch all starred repos (paginated, cached)
- `GET /api/random/:username?language=&min_stars=` - Get a random starred repo
- `GET /api/hidden-gems/:username?limit=` - Get underrated repos (scored, <100 stars)
- `GET /api/search/:username?q=&language=&min_stars=&limit=` - Search across starred repos
- `GET /api/stats/:username` - Aggregated statistics
- `GET /api/favorites` - User favorites (authenticated)
- `POST /api/favorites` - Add favorite (authenticated)
- `DELETE /api/favorites/*fullName` - Remove favorite (authenticated)

The React client uses relative `/api/auth` URLs, through Vite's proxy in development and the same origin in production. Keep the frontend and API same-site; in production set `BETTER_AUTH_URL` to the public HTTPS origin and `CORS_ORIGIN` to the frontend origin. `BETTER_AUTH_SECRET` must contain at least 32 high-entropy characters. `JWT_SECRET`, `COOKIE_SECRET`, `JWT_EXPIRY`, and `COOKIE_MAX_AGE` are no longer used; sessions last seven days.

Better Auth handles CSRF protection on its endpoints. Custom authenticated write endpoints (favorites and GitHub token settings) also require an `Origin` header matching `CORS_ORIGIN` or `BETTER_AUTH_URL`. Authentication rate limits are shared in PostgreSQL. The Fastify bridge replaces the internal IP header with Fastify's resolved client IP.

`TRUST_PROXY_HOPS` defaults to `0` (ignore forwarded IP headers). Before deploying behind a reverse proxy, set it to the verified fixed number of trusted hops so clients do not all share the proxy's login limit. For example, `1` selects the rightmost `X-Forwarded-For` entry supplied by one trusted proxy. Only enable this when clients cannot reach the backend by a shorter/untrusted path; never select an arbitrary leftmost header or blindly trust all proxies. Additional load balancers/CDNs can change the correct hop count.

Email verification, password recovery, and social login are not enabled. The existing GitHub API token setting is unchanged; tokens are not returned by the session API and are still stored in the existing application column.

## Building for Production

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
```

## License

MIT