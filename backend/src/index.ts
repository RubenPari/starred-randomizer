import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { config } from './config';
import dbAndAuthPlugin from './plugins/auth';
import { starredRoutes } from './routes/starred';
import { randomRoutes } from './routes/random';
import { hiddenGemsRoutes } from './routes/hidden-gems';
import { searchRoutes } from './routes/search';
import { statsRoutes } from './routes/stats';
import { favoritesRoutes } from './routes/favorites';
import { getCacheStats } from './services/github';

const FRONTEND_DIST = path.resolve(__dirname, '../../frontend/dist');

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

async function bootstrap() {
  await app.register(cors, { origin: config.corsOrigin, credentials: true });

  try {
    await app.register(fastifyStatic, {
      root: FRONTEND_DIST,
      prefix: '/',
    });
    console.log(`[INFO] Serving static frontend from ${FRONTEND_DIST}`);
  } catch (err) {
    console.warn('[WARN] Could not register static file server, frontend not available:', err);
  }

  await app.register(dbAndAuthPlugin);

  console.log(`[INFO] GITHUB_TOKEN caricato: [REDACTED]`);
  console.log(`[INFO] CORS origin: ${config.corsOrigin}`);
  console.log(`[INFO] Cache TTL: ${config.cacheTtlMs / 1000}s`);
  console.log(`[INFO] Request timeout: ${config.requestTimeoutMs}ms`);
  console.log(`[INFO] Starting server on port ${config.port}`);

  app.get('/api/health', async () => {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: Date.now(),
      cache: getCacheStats(),
    };
  });

  await app.register(starredRoutes);
  await app.register(randomRoutes);
  await app.register(hiddenGemsRoutes);
  await app.register(searchRoutes);
  await app.register(statsRoutes);
  await app.register(favoritesRoutes);

  app.setNotFoundHandler(async (request, reply) => {
    if (request.url.startsWith('/api/')) {
      return reply.status(404).send({ error: 'Not found' });
    }
    return reply.type('text/html').sendFile('index.html');
  });

  const signals = ['SIGTERM', 'SIGINT'] as const;
  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`[INFO] Received ${signal}, shutting down gracefully...`);
      try {
        await app.db.end();
        await app.close();
        console.log('[INFO] Server closed successfully');
        process.exit(0);
      } catch (err) {
        console.error('[ERROR] Error during shutdown:', err);
        process.exit(1);
      }
    });
  });

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`Server in ascolto su http://localhost:${config.port}`);
  } catch (err) {
    console.error('[FATAL] Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  console.error('[FATAL] Failed to bootstrap:', err);
  process.exit(1);
});
