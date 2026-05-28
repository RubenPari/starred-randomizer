import Database from 'better-sqlite3';
import path from 'path';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import argon2 from 'argon2';
import crypto from 'crypto';
import type { Database as DatabaseType, Statement } from 'better-sqlite3';

declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    db: DatabaseType;
    stmt: ReturnType<typeof initStatements>;
  }
  interface FastifyRequest {
    userId: string | null;
  }
}

const DB_PATH = path.resolve(process.cwd(), '../starred.db');

interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

interface DbUserPublic {
  id: string;
  email: string;
  created_at: string;
}

interface DbFavorite {
  id: string;
  repo_json: string;
  created_at: string;
}

function initStatements(db: DatabaseType) {
  return {
    findUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?') as Statement<[string], DbUser>,
    findUserById: db.prepare('SELECT id, email, created_at FROM users WHERE id = ?') as Statement<[string], DbUserPublic>,
    createUser: db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)') as Statement<[string, string, string]>,
    getFavorites: db.prepare('SELECT id, repo_json, created_at FROM favorites WHERE user_id = ? ORDER BY created_at DESC') as Statement<[string], DbFavorite>,
    addFavorite: db.prepare('INSERT INTO favorites (id, user_id, full_name, repo_json) VALUES (?, ?, ?, ?)') as Statement<[string, string, string, string]>,
    removeFavorite: db.prepare('DELETE FROM favorites WHERE user_id = ? AND full_name = ?') as Statement<[string, string]>,
    isFavorite: db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND full_name = ?') as Statement<[string, string], { '1': number }>,
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'cookie-secret-change-in-production';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function dbAndAuthPlugin(app: FastifyInstance) {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      repo_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, full_name)
    );

    CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
  `);

  app.decorate('db', db);
  app.decorate('stmt', initStatements(db));

  await app.register(import('@fastify/cookie'), {
    secret: COOKIE_SECRET,
    parseOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    },
  });

  await app.register(import('@fastify/jwt'), {
    secret: JWT_SECRET,
    cookie: {
      cookieName: 'token',
      signed: false,
    },
  });

  app.decorateRequest('userId', null);

  app.addHook('onRequest', async (request) => {
    try {
      const decoded = await request.jwtVerify<{ userId: string }>();
      request.userId = decoded.userId;
    } catch {
      request.userId = null;
    }
  });

  app.decorate('requireAuth', async function (request: FastifyRequest, reply: FastifyReply) {
    if (!request.userId) {
      return reply.status(401).send({ error: 'Autenticazione richiesta' });
    }
  });

  app.post('/api/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { email: string; password: string };
    const { email, password } = body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return reply.status(400).send({ error: 'Email non valida' });
    }

    if (!password || password.length < 8) {
      return reply.status(400).send({ error: 'La password deve avere almeno 8 caratteri' });
    }

    const existing = app.stmt.findUserByEmail.get(email.toLowerCase());
    if (existing) {
      return reply.status(409).send({ error: 'Email giÃ  registrata' });
    }

    const passwordHash = await argon2.hash(password);
    const id = crypto.randomUUID();

    app.stmt.createUser.run(id, email.toLowerCase(), passwordHash);

    const token = app.jwt.sign({ userId: id }, { expiresIn: '7d' });
    reply.setCookie('token', token, { path: '/' });

    return { id, email: email.toLowerCase() };
  });

  app.post('/api/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { email: string; password: string };
    const { email, password } = body;

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email e password sono obbligatori' });
    }

    const user = app.stmt.findUserByEmail.get(email.toLowerCase());
    if (!user) {
      return reply.status(401).send({ error: 'Credenziali non valide' });
    }

    const valid = await argon2.verify(user.password_hash, password);
    if (!valid) {
      return reply.status(401).send({ error: 'Credenziali non valide' });
    }

    const token = app.jwt.sign({ userId: user.id }, { expiresIn: '7d' });
    reply.setCookie('token', token, { path: '/' });

    return { id: user.id, email: user.email };
  });

  app.post('/api/auth/logout', async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie('token', { path: '/' });
    return { message: 'Logout effettuato' };
  });

  app.get('/api/auth/me', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.userId) {
      return reply.status(401).send({ error: 'Non autenticato' });
    }

    const user = app.stmt.findUserById.get(request.userId);
    if (!user) {
      reply.clearCookie('token', { path: '/' });
      return reply.status(401).send({ error: 'Utente non trovato' });
    }

    return user;
  });
}

export default fp(dbAndAuthPlugin, { name: 'dbAndAuth' });
