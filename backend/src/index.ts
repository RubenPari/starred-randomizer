import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { starredRoutes } from './routes/starred';
import { randomRoutes } from './routes/random';
import { hiddenGemsRoutes } from './routes/hidden-gems';
import { searchRoutes } from './routes/search';
import { statsRoutes } from './routes/stats';
import { getCacheStats } from './services/github';

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

async function bootstrap() {
  await app.register(cors, { origin: config.corsOrigin });

  console.log(`[INFO] GITHUB_TOKEN caricato: [REDACTED]`);
  console.log(`[INFO] CORS origin: ${config.corsOrigin}`);
  console.log(`[INFO] Cache TTL: ${config.cacheTtlMs / 1000}s`);
  console.log(`[INFO] Request timeout: ${config.requestTimeoutMs}ms`);
  console.log(`[INFO] Starting server on port ${config.port}`);

  // Health check endpoint
  app.get('/api/health', async () => {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: Date.now(),
      cache: getCacheStats(),
    };
  });

  // Register routes
  await app.register(starredRoutes);
  await app.register(randomRoutes);
  await app.register(hiddenGemsRoutes);
  await app.register(searchRoutes);
  await app.register(statsRoutes);

  // Graceful shutdown
  const signals = ['SIGTERM', 'SIGINT'] as const;
  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`[INFO] Received ${signal}, shutting down gracefully...`);
      try {
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
