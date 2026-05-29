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

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'cookie-secret-change-in-production';

if (process.env.NODE_ENV === 'production') {
  if (JWT_SECRET === 'dev-secret-change-in-production') {
    console.error('[FATAL] JWT_SECRET must be set in production');
    process.exit(1);
  }
  if (COOKIE_SECRET === 'cookie-secret-change-in-production') {
    console.error('[FATAL] COOKIE_SECRET must be set in production');
    process.exit(1);
  }
}

export const config = {
  port: parsePort(process.env.PORT),
  host: process.env.HOST || '0.0.0.0',
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
  jwtSecret: JWT_SECRET,
  cookieSecret: COOKIE_SECRET,
  jwtExpiry: process.env.JWT_EXPIRY || '7d',
  cookieMaxAge: parseIntEnv(process.env.COOKIE_MAX_AGE, 60 * 60 * 24 * 7),
  hiddenGemsMaxStars: parseIntEnv(process.env.HIDDEN_GEMS_MAX_STARS, 100),
  hiddenGemsDefaultLimit: parseIntEnv(process.env.HIDDEN_GEMS_DEFAULT_LIMIT, 10),
  hiddenGemsMaxLimit: parseIntEnv(process.env.HIDDEN_GEMS_MAX_LIMIT, 20),
  searchDefaultLimit: parseIntEnv(process.env.SEARCH_DEFAULT_LIMIT, 50),
  searchMaxLimit: parseIntEnv(process.env.SEARCH_MAX_LIMIT, 100),
  topTopicsLimit: parseIntEnv(process.env.TOP_TOPICS_LIMIT, 20),
  minPasswordLength: parseIntEnv(process.env.MIN_PASSWORD_LENGTH, 8),
};