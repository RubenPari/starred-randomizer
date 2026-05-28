import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { fetchAllStarred } from '../services/github';
import { isValidGithubUsername } from '../utils/validation';
import { getGithubErrorMessage } from '../utils/errors';
import { calculateHiddenGemScore, type HiddenGemScore } from '../utils/hidden-gems';

export async function hiddenGemsRoutes(app: FastifyInstance) {
  app.get('/api/hidden-gems/:username', async (request: FastifyRequest<{ Params: { username: string }; Querystring: { limit?: string } }>, reply: FastifyReply) => {
    const { username } = request.params;
    const { limit } = request.query;
    const maxResults = limit ? Math.min(parseInt(limit, 10), 20) : 10;

    console.log(`[INFO] Hidden gems request for username: ${username}, limit: ${maxResults}`);

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

    const scored = calculateHiddenGemScore(result.data);
    const gems: HiddenGemScore[] = [];

    for (const item of scored) {
      if (gems.length >= maxResults) break;
      if (item.repo.stargazers_count > 100) continue;
      if (item.repo.archived) continue;
      gems.push(item);
    }

    console.log(`[INFO] Found ${gems.length} hidden gems`);
    return gems;
  });
}
