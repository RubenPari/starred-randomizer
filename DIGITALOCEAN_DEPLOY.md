# Deploy on DigitalOcean App Platform

This guide explains how to deploy the Starred Randomizer application on [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform) using the `Dockerfile` and `do-app-spec.yaml` files at the repository root.

## Overview

The application is a full-stack project composed of:

- `frontend/` — React + Vite + TypeScript build
- `backend/` — Fastify + TypeScript API
- MySQL 8 — required for authentication and favorites persistence

The deployment uses a single Dockerfile component. The backend serves both the API and the compiled SPA from `frontend/dist`, so only one service is needed.

## Repository structure

```
.
├── backend/              # Fastify API
│   ├── package.json
│   └── src/
├── frontend/             # React SPA
│   ├── package.json
│   └── src/
├── Dockerfile            # Multi-stage build (frontend + backend + runtime)
├── .dockerignore         # Excludes node_modules, dist, secrets, docs
├── do-app-spec.yaml      # App Platform app specification
├── .env.example          # Environment variables reference
└── README.md
```

## What the Dockerfile does

The multi-stage build produces a minimal runtime image based on `node:20-slim`:

1. `frontend-build` — installs frontend deps and runs `npm run build`.
2. `backend-build` — installs backend deps and runs `npm run build` (TypeScript).
3. Runtime stage — installs only production backend deps with `npm ci --omit=dev`, then copies `backend/dist` and `frontend/dist` under `/app`. The backend resolves `frontend/dist` relative to its own path, so both directories must live under the same root.

The backend reads `PORT` (App Platform injects `8080` for Docker components) and binds to `0.0.0.0` by default.

## What `do-app-spec.yaml` does

- Creates one service component (`backend`) built from the Dockerfile.
- Region: `fra`, instance `apps-s-1vcpu-0.5gb` (Basic $5/mo), `instance_count: 1`.
- Health check on `GET /api/health`.
- Sets `NODE_ENV=production` (required for `secure` cookies and secret validation) and `DB_SSL=true` (required for the TLS connection to a Managed MySQL public endpoint).
- Declares the secret variables; their values are filled in after creation.

> **Security:** never commit real secrets. The `SECRET` variables in the spec are created empty and must be set in the dashboard (or via `doctl apps update`) before the first deploy.

## Prerequisites

- A [Managed MySQL](https://www.digitalocean.com/products/managed-databases-mysql) database cluster with the **public endpoint enabled** (the app connects from App Platform, not from your local network).
- The database firewall must accept connections from the App Platform outbound ranges (or from anywhere — not recommended — for quick tests). If the cluster only accepts trusted sources, add the App Platform egress ranges.
- A GitHub Personal Access Token (`GITHUB_TOKEN`) for the API.
- Strong random values for `JWT_SECRET` and `COOKIE_SECRET` (the backend refuses to start in production with the dev defaults).

## Required environment variables

Set the following variables on the app (dashboard → App Settings → Environment Variables, or `doctl apps update`).

| Variable | Required | Description |
|---|---|---|
| `GITHUB_TOKEN` | Yes | GitHub Personal Access Token used to call the GitHub API. |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens. Use a strong random string. |
| `COOKIE_SECRET` | Yes | Secret key for signing cookies. Use a strong random string. |
| `DB_HOST` | Yes | Public host of the Managed MySQL cluster, e.g. `db-mysql-fra1-xxxxx-do-user-xxxxx.db.ondigitalocean.com`. |
| `DB_PORT` | Yes | Public port of the Managed MySQL cluster, usually `25060` for Managed MySQL (not `3306`). |
| `DB_USER` | Yes | Database user, e.g. `doadmin`. |
| `DB_PASSWORD` | Yes | Database password. |
| `DB_NAME` | Yes | Database name, e.g. `defaultdb` or the one you created. |
| `DB_SSL` | No | `true` to enable TLS on the MySQL connection (required for the public endpoint; already set in the spec). |
| `NODE_ENV` | No | Set to `production` (already set in the spec). |
| `CORS_ORIGIN` | No | Not needed in production: the SPA and API share the same origin. Only set it if you use a separate frontend domain. |
| `HOST` | No | Bind host, defaults to `0.0.0.0`. |
| `PORT` | No | App Platform injects `8080` automatically for Docker components. |

> The database tables (`users`, `favorites`) are created automatically on the first startup — no migrations are needed.

## Deploy flow

### Option A — dashboard

1. In the App Platform control panel click **Create App**.
2. Connect your GitHub account and select the `RubenPari/starred-randomizer` repository, branch `master`.
3. App Platform detects the `Dockerfile`; select it as the build method.
4. Pick region `fra`, the Basic plan, and 1 instance.
5. Review and create; then set the secret environment variables in **App Settings → Environment Variables**.

### Option B — doctl

```bash
# Validate the spec syntax
doctl apps spec validate do-app-spec.yaml

# Create the app
doctl apps create --spec do-app-spec.yaml
```

Then set the secret values (from the database **Connection Details** page):

```bash
doctl apps update <app-id> --spec do-app-spec.yaml \
  --set-env GITHUB_TOKEN=<token> \
  --set-env JWT_SECRET=<random> \
  --set-env COOKIE_SECRET=<random> \
  --set-env DB_HOST=<public-host> \
  --set-env DB_PORT=25060 \
  --set-env DB_USER=<user> \
  --set-env DB_PASSWORD=<password> \
  --set-env DB_NAME=<dbname>
```

You can also paste the values directly in the dashboard; `doctl apps update` overwrites the whole spec, so the two approaches should not be mixed carelessly.

## Post-deploy checks

- Open the public domain (e.g. `https://starred-randomizer-xxxxx.ondigitalocean.app`).
- `GET /api/health` should return `status: ok`.
- Register an account and log in.
- Click **Carica Starred** to load repositories.
- Verify that filters (language, min stars, topic, archived, updated after) work in both the Randomizer and Search tabs.

## Troubleshooting

### Deploy stays unhealthy

- Check the deploy logs. `initSchema` fails at boot if the database is unreachable, so the health check fails.
- Verify `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` are set and that the public endpoint is enabled on the cluster.
- Verify the database firewall accepts the App Platform outbound ranges.

### MySQL TLS / connection errors

- The Managed MySQL public endpoint requires TLS: keep `DB_SSL=true`.
- Confirm the port: Managed MySQL public connections use `25060`, not `3306`.
- As an escape hatch only, `DB_SSL=false` disables TLS (works only if the cluster allows non-TLS connections).

### Container build fails on `npm ci --omit=dev` (argon2)

- `argon2` is a native module. `node:20-slim` (glibc/x64) usually has prebuilt binaries; if the build fails with a "no prebuilt binary" error, install the build tools in the runtime stage before `npm ci`:

  ```dockerfile
  RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
      && rm -rf /var/lib/apt/lists/*
  ```

### Backend refuses to start

- In production the backend exits if `JWT_SECRET` or `COOKIE_SECRET` is still the development default, or if `GITHUB_TOKEN` is missing. Set all secrets before the first deploy.

## Updating the deployment

Push any change to the `master` branch. App Platform rebuilds the Dockerfile and redeploys automatically. Tables are auto-created at boot, so no migration step is required.

## Useful commands

```bash
# Validate the app spec
doctl apps spec validate do-app-spec.yaml

# Run backend typecheck
cd backend && npm run typecheck

# Build the image locally
docker build -t starred-randomizer .

# Smoke test locally against a local MySQL
docker run --rm --env-file <env> -p 8080:8080 starred-randomizer
```

For the smoke test, use a local `.env` with `NODE_ENV=production`, `PORT=8080`, `DB_SSL=false`, and the local database credentials.
