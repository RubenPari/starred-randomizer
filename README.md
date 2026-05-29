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
- Authentication with JWT (register, login, logout)
- GitHub personal access token per user for higher rate limits
- Modern UI built with React and TypeScript (Italian language)
- Fast backend API with Fastify

## Tech Stack

- **Backend**: Fastify + TypeScript
- **Frontend**: React 19 + TypeScript + Vite 7
- **Styling**: Tailwind CSS v4
- **HTTP Client**: Axios
- **Database**: MySQL 8 (via Docker Compose or local)

## Prerequisites

- Node.js v20 or higher
- npm
- GitHub Personal Access Token
- MySQL 8 (or Docker for the provided Docker Compose setup)

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

# MySQL configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=starred_randomizer

# Auth secrets (MUST be changed in production)
JWT_SECRET=change-me-in-production
COOKIE_SECRET=change-me-in-production
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

### Option A: Docker Compose (recommended)

The easiest way to run everything (MySQL + app) is via Docker Compose:

```bash
# Set required environment variables
export GITHUB_TOKEN=your_token
export JWT_SECRET=your_jwt_secret
export COOKIE_SECRET=your_cookie_secret

docker compose up --build
```

- Application: `http://localhost:8080`
- MySQL: exposed on `localhost:3306`

MySQL data is persisted in a Docker volume (`mysql_data`).

The backend automatically creates missing tables on startup.

### Option B: Local Development

#### Start MySQL

Ensure MySQL is running locally and the database `starred_randomizer` exists:

```sql
CREATE DATABASE IF NOT EXISTS starred_randomizer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
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
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login (sets httpOnly cookie)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me/token` - Update GitHub token
- `GET /api/starred/:username` - Fetch all starred repos (paginated, cached)
- `GET /api/random/:username?language=&min_stars=` - Get a random starred repo
- `GET /api/hidden-gems/:username?limit=` - Get underrated repos (scored, <100 stars)
- `GET /api/search/:username?q=&language=&min_stars=&limit=` - Search across starred repos
- `GET /api/stats/:username` - Aggregated statistics
- `GET /api/favorites` - User favorites (authenticated)
- `POST /api/favorites` - Add favorite (authenticated)
- `DELETE /api/favorites/*fullName` - Remove favorite (authenticated)

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