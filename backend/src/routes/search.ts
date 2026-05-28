import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { fetchAllStarred } from '../services/github';
import { isValidGithubUsername } from '../utils/validation';
import { getGithubErrorMessage } from '../utils/errors';

interface SearchQuery {
  q: string;
  language?: string;
  min_stars?: string;
  limit?: string;
}

export async function searchRoutes(app: FastifyInstance) {
  app.get('/api/search/:username', async (request: FastifyRequest<{ Params: { username: string }; Querystring: SearchQuery }>, reply: FastifyReply) => {
    const { username } = request.params;
    const { q, language, min_stars, limit } = request.query;
    const maxResults = limit ? Math.min(parseInt(limit, 10), 100) : 50;

    if (!q || q.trim().length === 0) {
      return reply.status(400).send({ error: 'Parametro q richiesto' });
    }

    console.log(`[INFO] Search request for username: ${username}, query: ${q}`);

    if (!isValidGithubUsername(username)) {
      console.warn(`[WARN] Invalid username format: ${username}`);
      return reply.status(400).send({ error: 'Formato username non valido' });
    }

    const result = await fetchAllStarred(username);

    if (!result.ok) {
      return reply.status(result.status).send({
        error: getGithubErrorMessage(result.status),
      });
    }

    const query = q.toLowerCase();
    const filtered = result.data.filter((repo) => {
      const matchesQuery =
        repo.full_name.toLowerCase().includes(query) ||
        (repo.description?.toLowerCase() ?? '').includes(query) ||
        repo.topics.some((t) => t.toLowerCase().includes(query)) ||
        (repo.language?.toLowerCase() ?? '').includes(query);

      if (!matchesQuery) return false;
      if (language && repo.language?.toLowerCase() !== language.toLowerCase()) return false;
      if (min_stars && repo.stargazers_count < parseInt(min_stars, 10)) return false;

      return true;
    });

    const results = filtered.slice(0, maxResults);
    console.log(`[INFO] Search found ${results.length} results`);
    return results;
  });
}
