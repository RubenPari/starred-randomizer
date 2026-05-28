import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { fetchAllStarred } from '../services/github';
import { isValidGithubUsername } from '../utils/validation';
import { getGithubErrorMessage } from '../utils/errors';
import { filterRepos } from '../utils/filters';

export async function randomRoutes(app: FastifyInstance) {
  app.get('/api/random/:username', async (request: FastifyRequest<{ Params: { username: string }; Querystring: { language?: string; min_stars?: string } }>, reply: FastifyReply) => {
    const { username } = request.params;
    const { language, min_stars } = request.query;

    console.log(`[INFO] Random request for username: ${username}, language: ${language}, min_stars: ${min_stars}`);

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

    const repos = filterRepos(result.data, {
      language,
      min_stars: min_stars ? parseInt(min_stars, 10) : undefined,
    });

    console.log(`[DEBUG] After filters: ${repos.length} repositories`);

    if (!repos.length) {
      return reply.status(404).send({ error: 'Nessun repository trovato con questi filtri' });
    }

    const random = repos[Math.floor(Math.random() * repos.length)];
    console.log(`[INFO] Selected random repo: ${random.full_name}`);
    return random;
  });
}
