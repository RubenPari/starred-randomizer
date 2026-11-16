import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { fetchAllStarred } from '../services/github.js';
import { isValidGithubUsername } from './validation.js';
import { getGithubErrorMessage } from './errors.js';
import { getUserToken } from './user-token.js';
import type { Repo } from '../types.js';

export async function validateAndFetch(
  app: FastifyInstance,
  request: FastifyRequest<{ Params: { username: string } }>,
  reply: FastifyReply
): Promise<{ data: import('../types.js').Repo[] } | null> {
  const { username } = request.params;

  app.log.info(`Request for username: ${username}`);

  if (!isValidGithubUsername(username)) {
    app.log.warn(`Invalid username format: ${username}`);
    reply.status(400).send({ error: 'Formato username non valido' });
    return null;
  }

  const token = await getUserToken(app, request.userId);
  const result = await fetchAllStarred(username, token);

  if (!result.ok) {
    reply.status(result.status).send({ error: getGithubErrorMessage(result.status) });
    return null;
  }

  return { data: result.data as Repo[] };
}