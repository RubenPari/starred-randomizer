import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { Pool } from 'pg';
import argon2 from 'argon2';
import Fastify from 'fastify';

// Never load .env or connect to the application's database in tests.
process.env.NODE_ENV = 'test';
process.env.BETTER_AUTH_URL = 'http://localhost:3001';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.BETTER_AUTH_SECRET = 'test-only-better-auth-secret-not-for-production';
const { migrateAuth, assertAuthMigrated } = await import('../dist/auth-migration.js');
const { default: authPlugin } = await import('../dist/plugins/auth.js');
const { favoritesRoutes } = await import('../dist/routes/favorites.js');
const { getUserToken } = await import('../dist/utils/user-token.js');

async function database(t) {
  const db = await PGlite.create();
  const socket = new PGLiteSocketServer({ db, port: 0, host: '127.0.0.1' });
  await socket.start();
  const pool = new Pool({ connectionString: `postgresql://postgres@${socket.getServerConn()}/postgres`, max: 1 });
  t.after(async () => {
    await pool.end();
    await socket.stop();
    await db.close();
  });
  return pool;
}

const legacySchema = `
  CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    github_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE favorites (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    repo_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, full_name)
  );
`;

function cookieFrom(response) {
  const values = response.headers['set-cookie'];
  assert.ok(values, 'expected session cookies');
  return (Array.isArray(values) ? values : [values]).map((value) => value.split(';')[0]).join('; ');
}

test('legacy migration preserves identity and Better Auth secures application routes', { timeout: 60000 }, async (t) => {
  const pool = await database(t);
  await pool.query(legacySchema);
  const id = randomUUID();
  const hash = await argon2.hash('legacy-password-123');
  const repo = { full_name: 'example/legacy' };
  await pool.query(
    'INSERT INTO users (id, email, password_hash, github_token) VALUES ($1, $2, $3, $4)',
    [id, 'legacy@example.com', hash, 'test-only-github-api-token'],
  );
  await pool.query(
    'INSERT INTO favorites (id, user_id, full_name, repo_json) VALUES ($1, $2, $3, $4)',
    [randomUUID(), id, repo.full_name, JSON.stringify(repo)],
  );
  await assert.rejects(assertAuthMigrated(pool), /migrate:auth/);
  assert.equal(await migrateAuth(pool), true);
  assert.equal(await migrateAuth(pool), false);
  await assertAuthMigrated(pool);
  assert.equal((await pool.query('SELECT password FROM auth_accounts')).rows[0].password, hash);
  assert.equal(await getUserToken({ db: pool }, id), 'test-only-github-api-token');
  const user = (await pool.query('SELECT * FROM users')).rows[0];
  assert.equal(user.id, id);
  assert.equal(user.email_verified, false);
  assert.equal('password_hash' in user, false);

  const app = Fastify();
  t.after(() => app.close());
  await app.register(authPlugin, { pool });
  await app.register(favoritesRoutes);
  await app.ready();
  const origin = 'http://localhost:5173';
  const post = (url, payload, cookie, extraHeaders = {}) => app.inject({
    method: 'POST', url, payload,
    headers: { origin, ...(cookie ? { cookie } : {}), ...extraHeaders },
  });

  await t.test('JWT cookies no longer authorize protected routes', async () => {
    const response = await app.inject({ url: '/api/favorites', headers: { cookie: 'token=old-jwt' } });
    assert.equal(response.statusCode, 401);
  });
  await t.test('invalid credentials and malformed bodies are rejected', async () => {
    assert.equal((await post('/api/auth/sign-in/email', {
      email: 'legacy@example.com', password: 'incorrect-password',
    })).statusCode, 401);
    const malformed = await post('/api/auth/sign-in/email', {});
    assert.equal(malformed.statusCode, 400);
  });
  const login = await post('/api/auth/sign-in/email', {
    email: 'LEGACY@example.com', password: 'legacy-password-123',
  });
  assert.equal(login.statusCode, 200, login.body);
  assert.equal(login.json().user.id, id);
  const cookie = cookieFrom(login);
  assert.match(String(login.headers['set-cookie']), /HttpOnly/i);
  await t.test('session responses never expose stored GitHub credentials or password hashes', async () => {
    const session = await app.inject({ url: '/api/auth/get-session', headers: { cookie } });
    assert.equal(session.statusCode, 200, session.body);
    assert.equal(session.json().user.id, id);
    assert.equal(session.body.includes('test-only-github-api-token'), false);
    assert.equal(session.body.includes(hash), false);
  });
  await t.test('favorites and GitHub token remain accessible to the original user', async () => {
    const favorites = await app.inject({ url: '/api/favorites', headers: { cookie } });
    assert.equal(favorites.statusCode, 200);
    assert.equal(favorites.json()[0].repo.full_name, repo.full_name);
    const updated = await app.inject({
      method: 'PUT', url: '/api/auth/me/token',
      headers: { cookie, origin }, payload: { token: 'test-only-updated-token' },
    });
    assert.equal(updated.statusCode, 200, updated.body);
    assert.equal(await getUserToken({ db: pool }, id), 'test-only-updated-token');
  });
  await t.test('untrusted origins cannot sign in or modify application data', async () => {
    const untrusted = await app.inject({
      method: 'POST', url: '/api/auth/sign-in/email', remoteAddress: '192.0.2.2',
      payload: { email: 'legacy@example.com', password: 'legacy-password-123' },
      headers: { cookie, origin: 'https://attacker.invalid' },
    });
    assert.equal(untrusted.statusCode, 403, untrusted.body);
    const firstLogin = await app.inject({
      method: 'POST', url: '/api/auth/sign-in/email', remoteAddress: '192.0.2.4',
      payload: { email: 'legacy@example.com', password: 'legacy-password-123' },
      headers: { origin: 'https://attacker.invalid', 'sec-fetch-site': 'cross-site' },
    });
    assert.equal(firstLogin.statusCode, 403, firstLogin.body);
    for (const badOrigin of [undefined, 'https://attacker.invalid']) {
      const response = await app.inject({
        method: 'PUT', url: '/api/auth/me/token', payload: { token: 'blocked' },
        headers: { cookie, ...(badOrigin ? { origin: badOrigin } : {}) },
      });
      assert.equal(response.statusCode, 403);
    }
    const favorite = await post('/api/favorites', { repo: { full_name: 'attacker/repo' } }, cookie, {
      origin: 'https://attacker.invalid',
    });
    assert.equal(favorite.statusCode, 403);
    assert.equal(await getUserToken({ db: pool }, id), 'test-only-updated-token');
  });
  let otherCookie;
  await t.test('registration creates a UUID user and an Argon2 credential', async () => {
    const signup = await post('/api/auth/sign-up/email', {
      name: 'New User', email: 'new@example.com', password: 'new-password-123',
    });
    assert.equal(signup.statusCode, 200, signup.body);
    otherCookie = cookieFrom(signup);
    assert.match(signup.json().user.id, /^[0-9a-f-]{36}$/);
    const account = await pool.query('SELECT password FROM auth_accounts WHERE "userId" = $1', [signup.json().user.id]);
    assert.ok(await argon2.verify(account.rows[0].password, 'new-password-123'));
  });
  await t.test('favorites are isolated by user and CRUD remains functional', async () => {
    const empty = await app.inject({ url: '/api/favorites', headers: { cookie: otherCookie } });
    assert.deepEqual(empty.json(), []);
    const added = await post('/api/favorites', { repo: { full_name: 'example/new' } }, otherCookie);
    assert.equal(added.statusCode, 201, added.body);
    const removed = await app.inject({
      method: 'DELETE', url: '/api/favorites/example%2Fnew', headers: { origin, cookie: otherCookie },
    });
    assert.equal(removed.statusCode, 200, removed.body);
    const original = await app.inject({ url: '/api/favorites', headers: { cookie } });
    assert.equal(original.json().length, 1);
  });
  await t.test('rerunning migration never overwrites credentials changed by Better Auth', async () => {
    const changedHash = await argon2.hash('changed-password-123');
    await pool.query('UPDATE auth_accounts SET password = $1 WHERE "userId" = $2', [changedHash, id]);
    assert.equal(await migrateAuth(pool), false);
    assert.equal((await pool.query('SELECT password FROM auth_accounts WHERE "userId" = $1', [id])).rows[0].password, changedHash);
  });
  await t.test('logout revokes the database session, including a replayed cookie', async () => {
    const logout = await post('/api/auth/sign-out', {}, cookie);
    assert.equal(logout.statusCode, 200, logout.body);
    const replay = await app.inject({ url: '/api/favorites', headers: { cookie } });
    assert.equal(replay.statusCode, 401);
    assert.equal((await app.inject({
      method: 'PUT', url: '/api/auth/me/token', headers: { origin, cookie }, payload: { token: 'blocked' },
    })).statusCode, 401);
  });
  await t.test('repeated login attempts are rate limited despite spoofed IP headers', async () => {
    let response;
    for (let attempt = 0; attempt < 5; attempt++) {
      response = await app.inject({
        method: 'POST', url: '/api/auth/sign-in/email', remoteAddress: '192.0.2.3',
        headers: { origin, 'x-starred-client-ip': `198.51.100.${attempt}` },
        payload: { email: 'legacy@example.com', password: 'incorrect-password' },
      });
      if (response.statusCode === 429) break;
    }
    assert.equal(response.statusCode, 429);
  });
  await t.test('explicit proxy trust separates clients and ignores spoofed chain prefixes', async () => {
    const proxied = Fastify({ trustProxy: 1 });
    t.after(() => proxied.close());
    await proxied.register(authPlugin, { pool });
    const attempt = (forwarded) => proxied.inject({
      method: 'POST', url: '/api/auth/sign-in/email', remoteAddress: '192.0.2.200',
      headers: { origin, 'x-forwarded-for': forwarded },
      payload: { email: 'legacy@example.com', password: 'incorrect-password' },
    });
    for (let index = 0; index < 3; index++) {
      assert.equal((await attempt(`198.51.100.${index}, 192.0.2.10`)).statusCode, 401);
    }
    assert.equal((await attempt('198.51.100.99, 192.0.2.10')).statusCode, 429);
    assert.equal((await attempt('192.0.2.11')).statusCode, 401);
  });
});

test('fresh database migration and rollback of invalid legacy credentials', { timeout: 60000 }, async (t) => {
  const pool = await database(t);
  await pool.query(legacySchema);
  await pool.query('INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)', [
    randomUUID(), 'invalid@example.com', 'not-an-argon2-hash',
  ]);
  await assert.rejects(migrateAuth(pool), /credenziali legacy/);
  assert.equal((await pool.query("SELECT to_regclass('auth_accounts') AS name")).rows[0].name, null);
  assert.equal((await pool.query('SELECT password_hash FROM users')).rows[0].password_hash, 'not-an-argon2-hash');
  await pool.query('DELETE FROM users');
  assert.equal(await migrateAuth(pool), true);
  assert.equal(await migrateAuth(pool), false);
});

test('migration initializes a completely empty database', { timeout: 60000 }, async (t) => {
  const pool = await database(t);
  assert.equal(await migrateAuth(pool), true);
  await assertAuthMigrated(pool);
  assert.equal((await pool.query('SELECT count(*) FROM users')).rows[0].count, '0');
});
