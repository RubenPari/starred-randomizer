import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { validateAndFetch } from '../utils/validate-and-fetch';
import { filterRepos } from '../utils/filters';

function safeParseInt(val: string | undefined, fallback: number): number {
  if (!val) return fallback;
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? fallback : n;
}

export async function randomRoutes(app: FastifyInstance) {
  app.get('/api/random/:username', async (request: FastifyRequest<{ Params: { username: string }; Querystring: { language?: string; min_stars?: string; exclude?: string; topic?: string; include_archived?: string; updated_after?: string } }>, reply: FastifyReply) => {
    const { language, min_stars, exclude, topic, include_archived, updated_after } = request.query;

    const result = await validateAndFetch(app, request, reply);
    if (!result) return;

    const includeArchived = include_archived !== 'false' && include_archived !== '0';

    const repos = filterRepos(result.data, {
      language,
      min_stars: safeParseInt(min_stars, 0) || undefined,
      topic,
      include_archived: includeArchived,
      updated_after,
    });

    app.log.debug(`After filters: ${repos.length} repositories`);

    if (!repos.length) {
      return reply.status(404).send({ error: 'Nessun repository trovato con questi filtri' });
    }

    const excludeSet = new Set(
      (exclude ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    );

    const filtered = excludeSet.size > 0 ? repos.filter((r) => !excludeSet.has(r.full_name)) : repos;

    if (!filtered.length) {
      return reply.status(404).send({ error: 'Tutti i repository corrispondenti ai filtri sono già stati mostrati. Azzera la cronologia o allarga i filtri.' });
    }

    const random = filtered[Math.floor(Math.random() * filtered.length)];
    app.log.info(`Selected random repo: ${random.full_name}`);
    return random;
  });
}

export { safeParseInt };