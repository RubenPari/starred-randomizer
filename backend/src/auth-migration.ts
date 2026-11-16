import type { Pool } from 'pg';

const VERSION = '0001-better-auth';

// Schema for the pinned Better Auth version; runtime validation and integration
// tests check it against the library. Keep DDL and credential transfer atomic.
export async function migrateAuth(pool: Pool): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('starred-auth-migration'))");
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const applied = await client.query('SELECT 1 FROM app_migrations WHERE version = $1', [VERSION]);
    if (applied.rowCount) {
      await client.query('COMMIT');
      return false;
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT,
        github_token TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      LOCK TABLE users IN ACCESS EXCLUSIVE MODE;
      ALTER TABLE users
        ADD COLUMN name TEXT,
        ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN image TEXT,
        ADD COLUMN updated_at TIMESTAMP;
      UPDATE users SET
        name = split_part(email, '@', 1),
        created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
        updated_at = COALESCE(created_at, CURRENT_TIMESTAMP);
      ALTER TABLE users
        ALTER COLUMN name SET NOT NULL,
        ALTER COLUMN created_at SET NOT NULL,
        ALTER COLUMN updated_at SET NOT NULL;

      CREATE TABLE auth_accounts (
        id VARCHAR(36) PRIMARY KEY,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "userId" VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMP,
        "refreshTokenExpiresAt" TIMESTAMP,
        scope TEXT,
        password TEXT,
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL,
        UNIQUE ("providerId", "accountId")
      );
      CREATE INDEX auth_accounts_user_id_idx ON auth_accounts ("userId");
      CREATE TABLE auth_sessions (
        id VARCHAR(36) PRIMARY KEY,
        "expiresAt" TIMESTAMP NOT NULL,
        token TEXT UNIQUE NOT NULL,
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "userId" VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX auth_sessions_user_id_idx ON auth_sessions ("userId");
      CREATE TABLE auth_verifications (
        id VARCHAR(36) PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL
      );
      CREATE INDEX auth_verifications_identifier_idx ON auth_verifications (identifier);
      CREATE TABLE auth_rate_limits (
        id VARCHAR(36) PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        count INTEGER NOT NULL,
        "lastRequest" BIGINT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS favorites (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        repo_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, full_name)
      );
      CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
    `);

    const invalid = await client.query(`
      SELECT 1 FROM users
      WHERE password_hash IS NULL
        OR password_hash !~ '^\\$argon2(id|i|d)\\$'
        OR email <> lower(email)
      LIMIT 1
    `);
    if (invalid.rowCount) {
      throw new Error('Migrazione annullata: credenziali legacy non valide o email non normalizzate');
    }
    await client.query(`
      INSERT INTO auth_accounts
        (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
      SELECT id, id, 'credential', id, password_hash, created_at, updated_at FROM users;
      ALTER TABLE users DROP COLUMN password_hash;
    `);
    await client.query('INSERT INTO app_migrations (version) VALUES ($1)', [VERSION]);
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function assertAuthMigrated(pool: Pool): Promise<void> {
  const tables = await pool.query("SELECT to_regclass('app_migrations') AS name");
  if (tables.rows[0]?.name) {
    const result = await pool.query('SELECT 1 FROM app_migrations WHERE version = $1', [VERSION]);
    if (result.rowCount) return;
  }
  throw new Error('Schema auth non aggiornato. Eseguire npm run build && npm run migrate:auth da backend/ prima di avviare il server.');
}
