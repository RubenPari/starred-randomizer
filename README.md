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

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/starred-randomizer.git
cd starred-randomizer
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
GITHUB_TOKEN=your_github_personal_access_token
PORT=3001
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Start the Backend Server

```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:3001`

### Start the Frontend Development Server

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