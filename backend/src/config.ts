import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { parseDbPoolMax } from './db-pool-config.js';

const parentEnv = path.resolve(process.cwd(), '../.env');
if (process.env.NODE_ENV !== 'test') {
  if (fs.existsSync(parentEnv)) {
    dotenv.config({ path: parentEnv, quiet: true });
  } else {
    dotenv.config({ quiet: true });
  }
}

function parsePort(portStr: string | undefined): number {
  if (!portStr) return 3001;
  const port = Number(portStr);
  if (Number.isNaN(port) || port < 0 || port > 65535) return 3001;
  return port;
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

function parseIntEnv(val: string | undefined, fallback: number): number {
  if (!val) return fallback;
  const n = Number(val);
  return Number.isNaN(n) ? fallback : n;
}

const DEV_AUTH_SECRET = 'starred-randomizer-local-development-only-secret';
const AUTH_SECRET = process.env.BETTER_AUTH_SECRET || DEV_AUTH_SECRET;
const AUTH_URL = process.env.BETTER_AUTH_URL || `http://localhost:${parsePort(process.env.PORT)}`;
const proxyHopsValue = process.env.TRUST_PROXY_HOPS ?? '0';
const trustProxyHops = Number(proxyHopsValue);
if (!/^\d+$/.test(proxyHopsValue) || !Number.isSafeInteger(trustProxyHops) || trustProxyHops > 10) {
  throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 10');
}

if (AUTH_SECRET.length < 32) {
  throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters');
}
if (process.env.NODE_ENV === 'production' && AUTH_SECRET === DEV_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET must be set in production');
}
const authUrl = new URL(AUTH_URL);
if (!['http:', 'https:'].includes(authUrl.protocol) || authUrl.username || authUrl.password
    || authUrl.pathname !== '/' || authUrl.search || authUrl.hash) {
  throw new Error('BETTER_AUTH_URL must be an HTTP(S) origin without path or credentials');
}
if (process.env.NODE_ENV === 'production' && authUrl.protocol !== 'https:') {
  throw new Error('BETTER_AUTH_URL must use HTTPS in production');
}

export const config = {
  port: parsePort(process.env.PORT),
  host: process.env.HOST || '0.0.0.0',
  trustProxyHops,
  githubToken: GITHUB_TOKEN,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  githubApiBaseUrl: 'https://api.github.com',
  perPage: 100,
  maxPages: 20,
  requestTimeoutMs: 15_000,
  cacheTtlMs: 5 * 60 * 1000,
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: parseIntEnv(process.env.DB_PORT, 5432),
  dbUser: process.env.DB_USER || 'root',
  dbPassword: process.env.DB_PASSWORD || '',
  dbName: process.env.DB_NAME || 'starred_randomizer',
  dbPoolMax: parseDbPoolMax(process.env.DB_POOL_MAX),
  dbSsl: process.env.DB_SSL === 'true',
  authSecret: AUTH_SECRET,
  authUrl: authUrl.origin,
  hiddenGemsMaxStars: parseIntEnv(process.env.HIDDEN_GEMS_MAX_STARS, 100),
  hiddenGemsDefaultLimit: parseIntEnv(process.env.HIDDEN_GEMS_DEFAULT_LIMIT, 10),
  hiddenGemsMaxLimit: parseIntEnv(process.env.HIDDEN_GEMS_MAX_LIMIT, 20),
  searchDefaultLimit: parseIntEnv(process.env.SEARCH_DEFAULT_LIMIT, 50),
  searchMaxLimit: parseIntEnv(process.env.SEARCH_MAX_LIMIT, 100),
  topTopicsLimit: parseIntEnv(process.env.TOP_TOPICS_LIMIT, 20),
  minPasswordLength: parseIntEnv(process.env.MIN_PASSWORD_LENGTH, 8),
};