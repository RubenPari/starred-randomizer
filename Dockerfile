# ============================================================
# Stage 1: Build frontend
# ============================================================
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci || npm install

COPY frontend/ .
RUN npm run build

# ============================================================
# Stage 2: Build backend (compile TypeScript)
# ============================================================
FROM node:20 AS backend-builder

WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json* ./
RUN npm ci || npm install

COPY backend/ .
RUN npm run build

# ============================================================
# Stage 3: Production runtime
# ============================================================
FROM node:20-slim AS runtime

WORKDIR /app

# Copy backend node_modules
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm ci --omit=dev || npm install --omit=dev

# Copy compiled backend
COPY --from=backend-builder /app/backend/dist ./backend/dist

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "backend/dist/index.js"]
