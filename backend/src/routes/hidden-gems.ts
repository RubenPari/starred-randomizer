import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { validateAndFetch } from '../utils/validate-and-fetch.js';
import { calculateHiddenGemScore, type HiddenGemScore } from '../utils/hidden-gems.js';
import { config } from '../config.js';
import { safeParseInt } from './random.js';

export async function hiddenGemsRoutes(app: FastifyInstance) {
  app.get('/api/hidden-gems/:username', async (request: FastifyRequest<{ Params: { username: string }; Querystring: { limit?: string } }>, reply: FastifyReply) => {
    const { limit } = request.query;
    const maxResults = Math.min(safeParseInt(limit, config.hiddenGemsDefaultLimit), config.hiddenGemsMaxLimit);

    app.log.info(`Hidden gems request, limit: ${maxResults}`);

    const result = await validateAndFetch(app, request, reply);
    if (!result) return;

    const scored = calculateHiddenGemScore(result.data);
    const gems: HiddenGemScore[] = [];

    for (const item of scored) {
      if (gems.length >= maxResults) break;
      if (item.repo.stargazers_count > config.hiddenGemsMaxStars) continue;
      if (item.repo.archived) continue;
      gems.push(item);
    }

    app.log.info(`Found ${gems.length} hidden gems`);
    return gems;
  });
}