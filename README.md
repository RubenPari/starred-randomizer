# GitHub Starred Randomizer

A full-stack TypeScript application that allows users to explore their GitHub starred repositories and randomly pick one based on filters.

## Features

- Fetch all starred repositories for a GitHub user
- Filter repositories by programming language
- Filter repositories by minimum star count
- Randomly select a repository from the filtered results
- Modern UI built with React and TypeScript
- Fast backend API with Fastify

## Tech Stack

- **Backend**: Fastify + TypeScript
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- GitHub Personal Access Token
- MySQL (or Docker for the provided Docker Compose setup)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/starred-randomizer.git
cd starred-randomizer
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```env
GITHUB_TOKEN=your_github_personal_access_token
PORT=3001

# MySQL configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=starred_randomizer

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
docker-compose up --build
```

- Application: `http://localhost:8080`
- MySQL: exposed on `localhost:3306`

MySQL data is persisted in a Docker volume (`mysql_data`).

**Automatic database migration**: the first time the `db` container starts, Docker Compose automatically runs the SQL initialization script (`docker/mysql/init/01-schema.sql`) to create the database schema. If you run the app outside Docker, the backend also auto-creates missing tables on startup.

To stop:

```bash
docker-compose down
```

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
2. Enter a GitHub username
3. Click "Carica Starred" to fetch all starred repositories
4. Optionally set filters:
   - Language: Filter by programming language (e.g., "JavaScript", "Python")
   - Min stars: Filter by minimum star count
5. Click "Estrai Random" to get a random repository from the filtered results

## API Endpoints

- `GET /api/starred/:username` - Fetch starred repositories for a user
  - Query params: `page`, `per_page`
- `GET /api/random/:username` - Get a random starred repository
  - Query params: `language`, `min_stars`

## Building for Production

### Backend

```bash
cd backend
npm run build
```

### Frontend

```bash
cd frontend
npm run build
```

## License

MIT