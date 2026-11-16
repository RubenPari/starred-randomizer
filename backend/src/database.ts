import { Pool } from 'pg';
import { config } from './config.js';

export function createPool() {
  return new Pool({
    host: config.dbHost,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
    max: config.dbPoolMax,
    ssl: config.dbSsl ? { rejectUnauthorized: false } : undefined,
  });
}
