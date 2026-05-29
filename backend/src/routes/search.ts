import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { validateAndFetch } from '../utils/validate-and-fetch';
import { filterRepos } from '../utils/filters';
import { config } from '../config';
import { safeParseInt } from './random';

interface SearchQuery {
  q: string;
  language?: string;
  min_stars?: string;
  limit?: string;
}

export async function searchRoutes(app: FastifyInstance) {
  app.get('/api/search/:username', async (request: FastifyRequest<{ Params: { username: string }; Querystring: SearchQuery }>, reply: FastifyReply) => {
    const { q, language, min_stars, limit } = request.query;

    if (!q || q.trim().length === 0) {
      return reply.status(400).send({ error: 'Parametro q richiesto' });
    }

    const maxResults = Math.min(safeParseInt(limit, config.searchDefaultLimit), config.searchMaxLimit);

    app.log.info(`Search request, query: ${q}`);

    const result = await validateAndFetch(app, request, reply);
    if (!result) return;

    const query = q.toLowerCase();
    const matchesQuery = (repo: import('../types').Repo) =>
      repo.full_name.toLowerCase().includes(query) ||
      (repo.description?.toLowerCase() ?? '').includes(query) ||
      repo.topics.some((t) => t.toLowerCase().includes(query)) ||
      (repo.language?.toLowerCase() ?? '').includes(query);

    const baseFiltered = filterRepos(result.data, {
      language,
      min_stars: safeParseInt(min_stars, 0) || undefined,
    });

    const filtered = baseFiltered.filter(matchesQuery);

    const results = filtered.slice(0, maxResults);
    app.log.info(`Search found ${results.length} results`);
    return results;
  });
}