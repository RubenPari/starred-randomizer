import Fastify from 'fastify';
import { createPool } from './database.js';
import { migrateAuth } from './auth-migration.js';

const logger = Fastify({ logger: true }).log;
const pool = createPool();
try {
  const changed = await migrateAuth(pool);
  logger.info(changed ? 'Migrazione Better Auth completata' : 'Migrazione Better Auth già applicata');
} catch (error) {
  // Do not log query parameters, credentials, or the connection configuration.
  logger.error(error instanceof Error ? error.message : 'Migrazione Better Auth fallita');
  process.exitCode = 1;
} finally {
  await pool.end();
}
