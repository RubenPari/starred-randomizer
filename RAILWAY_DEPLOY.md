# Deploy on Railway

This guide explains how to deploy the Starred Randomizer application on [Railway](https://railway.app).

## Overview

The application is a full-stack project composed of:

- `frontend/` — React + Vite + TypeScript build
- `backend/` — Fastify + TypeScript API
- MySQL 8 — required for authentication and favorites persistence

The deployment uses the `railway.json` file at the repository root to configure the Nixpacks build and the start command.

## Repository structure

```
.
├── backend/           # Fastify API
│   ├── package.json
│   └── src/
├── frontend/          # React SPA
│   ├── package.json
│   └── src/
├── .env.example       # Environment variables reference
├── railway.json       # Railway build/deploy configuration
└── README.md
```

## What `railway.json` does

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "nixpacksPlan": {
      "phases": {
        "setup": {
          "nixPkgs": ["nodejs_20"]
        },
        "install": {
          "cmds": [
            "cd frontend && npm ci",
            "cd backend && npm ci"
          ]
        },
        "build": {
          "cmds": [
            "cd frontend && npm run build",
            "cd backend && npm run build"
          ]
        }
      }
    }
  },
  "deploy": {
    "startCommand": "node backend/dist/index.js",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

- **Node.js 20** is installed via Nixpacks.
- Both workspaces are installed and built.
- The backend serves the compiled frontend static files from `frontend/dist` at runtime.
- Railway performs a health check on `/api/health` before marking the deployment as healthy.

## Required environment variables

Create the following variables in the Railway project dashboard (or via the Railway CLI). Values must be set before the first deploy.

| Variable | Required | Description |
|---|---|---|
| `GITHUB_TOKEN` | Yes | GitHub Personal Access Token used to call the GitHub API. |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens. Use a strong random string in production. |
| `COOKIE_SECRET` | Yes | Secret key for signing cookies. Use a strong random string in production. |
| `DB_HOST` | Yes | MySQL host. Use the internal hostname provided by the Railway MySQL service. |
| `DB_PORT` | Yes | MySQL port (usually `3306`). |
| `DB_USER` | Yes | MySQL user. |
| `DB_PASSWORD` | Yes | MySQL password. |
| `DB_NAME` | Yes | MySQL database name. |
| `PORT` | No | Port the backend listens on. Railway injects `PORT` automatically; the backend falls back to `3001`. |
| `CORS_ORIGIN` | No | Allowed frontend origin for CORS. In production Railway provides a public domain automatically. |
| `HOST` | No | Bind host. Defaults to `0.0.0.0`. |

> **Security:** never commit `.env` or real secrets. Use `.env.example` as a reference and configure secrets in the Railway dashboard.

## Provision services on Railway

1. Create a new project from the Railway dashboard.
2. Add a service connected to your GitHub repository.
3. Add a **MySQL** service to the same project.
4. In the MySQL service settings, create a database named `starred_randomizer` or set `DB_NAME` to the default database name provided by Railway.
5. Copy the MySQL connection details into the application service environment variables.

## Deploy flow

1. Push `railway.json` and the latest code to the repository.
2. Railway detects `railway.json` and runs:
   - `npm ci` in both `frontend/` and `backend/`.
   - `npm run build` in both workspaces.
3. The deploy starts `node backend/dist/index.js`.
4. The health check endpoint `GET /api/health` is polled until it returns `200`.
5. Railway assigns a public domain once the deployment is healthy.

## Post-deploy checks

- Open the public domain in a browser.
- Register an account and log in.
- Click **Carica Starred** to load repositories.
- Verify that filters (language, min stars, topic, archived, updated after) work in both the Randomizer and Search tabs.

## Troubleshooting

### Build fails on install

- Ensure `package-lock.json` files are committed and up to date.
- Use `npm ci` locally in both `frontend/` and `backend/` to reproduce the issue.

### Health check fails

- Check the deploy logs for startup errors.
- Verify that all required environment variables are set.
- Ensure MySQL is reachable from the application service.

### MySQL connection errors

- Use the internal Railway hostname for the MySQL service, not `localhost`.
- Confirm the database exists and the user has the correct permissions.
- The application creates the required tables automatically on startup.

## Updating the deployment

Push any change to the repository branch Railway is watching. The build and deploy pipeline runs automatically. To avoid downtime during updates, make sure the database migrations (if any) are backward-compatible; the current version auto-creates tables on startup.

## Useful commands

```bash
# Validate railway.json syntax
python3 -m json.tool railway.json

# Run backend typecheck
cd backend && npm run typecheck

# Build frontend production bundle
cd frontend && npm run build
```
