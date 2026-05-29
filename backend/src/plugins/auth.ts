import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import argon2 from 'argon2';
import crypto from 'crypto';
import { createPool, type Pool, type RowDataPacket } from 'mysql2/promise';
import { config } from '../config';

declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    db: Pool;
  }
  interface FastifyRequest {
    userId: string | null;
  }
}

interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  github_token: string | null;
  created_at: string;
}

interface DbUserPublic {
  id: string;
  email: string;
  created_at: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function initSchema(pool: Pool) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      github_token TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS favorites (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      repo_json TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, full_name),
      CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  try {
    await pool.execute(`
      CREATE INDEX idx_favorites_user_id ON favorites(user_id)
    `);
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code !== 'ER_DUP_KEYNAME' && !e.message?.includes('Duplicate key name')) {
      throw err;
    }
  }
}

async function findUserByEmail(pool: Pool, email: string): Promise<DbUser | null> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
  return (rows[0] as DbUser | undefined) ?? null;
}

async function findUserPublicById(pool: Pool, id: string): Promise<DbUserPublic | null> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT id, email, created_at FROM users WHERE id = ?', [id]);
  return (rows[0] as DbUserPublic | undefined) ?? null;
}

async function createUser(pool: Pool, id: string, email: string, passwordHash: string): Promise<void> {
  await pool.execute('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)', [id, email, passwordHash]);
}

async function updateUserToken(pool: Pool, userId: string, token: string | null): Promise<void> {
  await pool.execute('UPDATE users SET github_token = ? WHERE id = ?', [token, userId]);
}

class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

async function dbAndAuthPlugin(app: FastifyInstance) {
  const pool = createPool({
    host: config.dbHost,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
    waitForConnections: true,
    connectionLimit: 10,
  });

  await initSchema(pool);

  app.decorate('db', pool);

  await app.register(import('@fastify/cookie'), {
    secret: config.cookieSecret,
    parseOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: config.cookieMaxAge,
    },
  });

  await app.register(import('@fastify/jwt'), {
    secret: config.jwtSecret,
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

  app.decorate('requireAuth', async function (request: FastifyRequest, _reply: FastifyReply) {
    if (!request.userId) {
      throw new UnauthorizedError();
    }
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof UnauthorizedError) {
      return reply.status(401).send({ error: 'Autenticazione richiesta' });
    }
    app.log.error(error);
    return reply.status(500).send({ error: 'Errore interno del server' });
  });

  app.post('/api/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { email: string; password: string };
    const { email, password } = body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return reply.status(400).send({ error: 'Email non valida' });
    }

    if (!password || password.length < config.minPasswordLength) {
      return reply.status(400).send({ error: `La password deve avere almeno ${config.minPasswordLength} caratteri` });
    }

    const existing = await findUserByEmail(pool, email.toLowerCase());
    if (existing) {
      return reply.status(409).send({ error: 'Email già registrata' });
    }

    const passwordHash = await argon2.hash(password);
    const id = crypto.randomUUID();

    await createUser(pool, id, email.toLowerCase(), passwordHash);

    const token = app.jwt.sign({ userId: id }, { expiresIn: config.jwtExpiry });
    reply.setCookie('token', token, { path: '/' });

    return { id, email: email.toLowerCase() };
  });

  app.post('/api/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { email: string; password: string };
    const { email, password } = body;

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email e password sono obbligatori' });
    }

    const user = await findUserByEmail(pool, email.toLowerCase());
    if (!user) {
      return reply.status(401).send({ error: 'Credenziali non valide' });
    }

    const valid = await argon2.verify(user.password_hash, password);
    if (!valid) {
      return reply.status(401).send({ error: 'Credenziali non valide' });
    }

    const token = app.jwt.sign({ userId: user.id }, { expiresIn: config.jwtExpiry });
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

    const user = await findUserPublicById(pool, request.userId);
    if (!user) {
      reply.clearCookie('token', { path: '/' });
      return reply.status(401).send({ error: 'Utente non trovato' });
    }

    return user;
  });

  app.put('/api/auth/me/token', async (request: FastifyRequest, reply: FastifyReply) => {
    await app.requireAuth(request, reply);

    const body = request.body as { token?: string };
    const { token } = body;

    if (token === undefined) {
      return reply.status(400).send({ error: 'Token mancante' });
    }

    await updateUserToken(pool, request.userId!, token || null);
    return { message: 'Token aggiornato' };
  });
}

export default fp(dbAndAuthPlugin, { name: 'dbAndAuth' });