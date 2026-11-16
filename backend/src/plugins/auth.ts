import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { fromNodeHeaders } from 'better-auth/node';
import type { Pool } from 'pg';
import { createAuth } from '../auth.js';
import { assertAuthMigrated } from '../auth-migration.js';
import { createPool } from '../database.js';
import { config } from '../config.js';

declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    db: Pool;
  }
  interface FastifyRequest {
    userId: string | null;
  }
}

class UnauthorizedError extends Error {}
class UntrustedOriginError extends Error {}

interface AuthPluginOptions {
  // An injected pool is owned by the caller (used by isolated integration tests).
  pool?: Pool;
}

async function dbAndAuthPlugin(app: FastifyInstance, options: AuthPluginOptions) {
  const pool = options.pool ?? createPool();
  try {
    await assertAuthMigrated(pool);
  } catch (error) {
    if (!options.pool) await pool.end();
    throw error;
  }
  if (!options.pool) app.addHook('onClose', async () => pool.end());
  const auth = createAuth(pool);
  app.decorate('db', pool);
  app.decorateRequest('userId', null);

  app.addHook('onRequest', async (request) => {
    // The handler itself manages refresh cookies for auth routes. Other routes
    // only read sessions; they must not silently refresh without forwarding cookies.
    if (request.url.split('?')[0].startsWith('/api/auth/')) return;
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
      query: { disableRefresh: true },
    });
    request.userId = session?.user.id ?? null;
  });

  app.decorate('requireAuth', async function (request: FastifyRequest, _reply: FastifyReply) {
    if (!request.userId) throw new UnauthorizedError();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      // Custom application endpoints are outside Better Auth's CSRF middleware.
      const origin = request.headers.origin;
      if (!origin || ![config.corsOrigin, config.authUrl].includes(origin)) {
        throw new UntrustedOriginError();
      }
    }
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof UnauthorizedError) {
      return reply.status(401).send({ error: 'Autenticazione richiesta' });
    }
    if (error instanceof UntrustedOriginError) {
      return reply.status(403).send({ error: 'Origine della richiesta non consentita' });
    }
    const status = error.statusCode;
    if (status && status >= 400 && status < 500) {
      return reply.status(status).send({ error: 'Richiesta non valida' });
    }
    app.log.error(error);
    return reply.status(500).send({ error: 'Errore interno del server' });
  });

  app.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    async handler(request, reply) {
      const headers = fromNodeHeaders(request.headers);
      headers.set('x-starred-client-ip', request.ip);
      const response = await auth.handler(new Request(new URL(request.url, config.authUrl), {
        method: request.method,
        headers,
        ...(request.body === undefined ? {} : { body: JSON.stringify(request.body) }),
      }));
      reply.status(response.status);
      response.headers.forEach((value, key) => {
        if (key !== 'set-cookie') reply.header(key, value);
      });
      const cookies = response.headers.getSetCookie();
      if (cookies.length) reply.header('set-cookie', cookies);
      return reply.send(response.body ? await response.text() : null);
    },
  });

  app.put('/api/auth/me/token', async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
      query: { disableRefresh: true },
    });
    request.userId = session?.user.id ?? null;
    await app.requireAuth(request, reply);
    const token = (request.body as { token?: unknown } | null)?.token;
    if (typeof token !== 'string' || token.length > 1024) {
      return reply.status(400).send({ error: 'Token mancante o non valido' });
    }
    await pool.query('UPDATE users SET github_token = $1 WHERE id = $2', [token || null, request.userId]);
    return { message: 'Token aggiornato' };
  });
}

export default fp(dbAndAuthPlugin, { name: 'dbAndAuth' });
