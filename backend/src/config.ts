import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

const parentEnv = path.resolve(process.cwd(), '../.env');
if (fs.existsSync(parentEnv)) {
  dotenv.config({ path: parentEnv });
} else {
  dotenv.config();
}

function parsePort(portStr: string | undefined): number {
  if (!portStr) return 3001;
  const port = Number(portStr);
  if (Number.isNaN(port) || port < 0 || port > 65535) return 3001;
  return port;
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('[FATAL] GITHUB_TOKEN non è definito');
  process.exit(1);
}

function parseIntEnv(val: string | undefined, fallback: number): number {
  if (!val) return fallback;
  const n = Number(val);
  return Number.isNaN(n) ? fallback : n;
}

export const config = {
  port: parsePort(process.env.PORT),
  githubToken: GITHUB_TOKEN,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  githubApiBaseUrl: 'https://api.github.com',
  perPage: 100,
  maxPages: 20,
  requestTimeoutMs: 15_000,
  cacheTtlMs: 5 * 60 * 1000,
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: parseIntEnv(process.env.DB_PORT, 3306),
  dbUser: process.env.DB_USER || 'root',
  dbPassword: process.env.DB_PASSWORD || '',
  dbName: process.env.DB_NAME || 'starred_randomizer',
};
