import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

function parsePort(portStr: string | undefined): number {
  if (!portStr) return 3001;
  const port = Number(portStr);
  if (Number.isNaN(port) || port < 0 || port > 65535) return 3001;
  return port;
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('[FATAL] GITHUB_TOKEN non è definito nel file .env');
  process.exit(1);
}

export const config = {
  port: parsePort(process.env.PORT),
  githubToken: GITHUB_TOKEN,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  githubApiBaseUrl: 'https://api.github.com',
  perPage: 100,
  maxPages: 20,
  requestTimeoutMs: 15_000,
  cacheTtlMs: 5 * 60 * 1000, // 5 minutes
};
