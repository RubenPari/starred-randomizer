import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { fetchAllStarred } from '../services/github';
import { isValidGithubUsername } from '../utils/validation';
import { getGithubErrorMessage } from '../utils/errors';

export async function starredRoutes(app: FastifyInstance) {
  app.get('/api/starred/:username', async (request: FastifyRequest<{ Params: { username: string } }>, reply: FastifyReply) => {
    const { username } = request.params;

    console.log(`[INFO] Request for username: ${username}`);

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

    return result.data;
  });
}
