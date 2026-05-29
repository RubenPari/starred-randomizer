import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { validateAndFetch } from '../utils/validate-and-fetch';
import { filterRepos } from '../utils/filters';

function safeParseInt(val: string | undefined, fallback: number): number {
  if (!val) return fallback;
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? fallback : n;
}

export async function randomRoutes(app: FastifyInstance) {
  app.get('/api/random/:username', async (request: FastifyRequest<{ Params: { username: string }; Querystring: { language?: string; min_stars?: string } }>, reply: FastifyReply) => {
    const { language, min_stars } = request.query;

    const result = await validateAndFetch(app, request, reply);
    if (!result) return;

    const repos = filterRepos(result.data, {
      language,
      min_stars: safeParseInt(min_stars, 0) || undefined,
    });

    app.log.debug(`After filters: ${repos.length} repositories`);

    if (!repos.length) {
      return reply.status(404).send({ error: 'Nessun repository trovato con questi filtri' });
    }

    const random = repos[Math.floor(Math.random() * repos.length)];
    app.log.info(`Selected random repo: ${random.full_name}`);
    return random;
  });
}

export { safeParseInt };