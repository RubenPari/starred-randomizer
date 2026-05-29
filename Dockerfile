# ============================================================
# Stage 1: Build frontend
# ============================================================
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# ============================================================
# Stage 2: Build backend (compile TypeScript)
# ============================================================
FROM node:20-slim AS backend-builder

WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json* ./
RUN npm ci

COPY backend/ .
RUN npm run build

# ============================================================
# Stage 3: Production runtime
# ============================================================
FROM node:20-slim AS runtime

WORKDIR /app

COPY --chown=node:node backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm ci --omit=dev

COPY --chown=node:node --from=backend-builder /app/backend/dist ./backend/dist
COPY --chown=node:node --from=frontend-builder /app/frontend/dist ./frontend/dist

USER node

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://localhost:8080/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "backend/dist/index.js"]