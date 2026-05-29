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
    app.log.info(`Serving static frontend from ${FRONTEND_DIST}`);
  } catch (err) {
    app.log.warn({ err }, 'Could not register static file server, frontend not available');
  }

  await app.register(dbAndAuthPlugin);

  app.log.info(`GITHUB_TOKEN caricato: [REDACTED]`);
  app.log.info(`CORS origin: ${config.corsOrigin}`);
  app.log.info(`Cache TTL: ${config.cacheTtlMs / 1000}s`);
  app.log.info(`Request timeout: ${config.requestTimeoutMs}ms`);
  app.log.info(`Starting server on port ${config.port}`);

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
      app.log.info(`Received ${signal}, shutting down gracefully...`);
      try {
        await app.db.end();
        await app.close();
        app.log.info('Server closed successfully');
        process.exit(0);
      } catch (err) {
        app.log.fatal({ err }, 'Error during shutdown');
        process.exit(1);
      }
    });
  });

  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(`Server in ascolto su http://localhost:${config.port}`);
  } catch (err) {
    app.log.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  console.error('[FATAL] Failed to bootstrap:', err);
  process.exit(1);
});