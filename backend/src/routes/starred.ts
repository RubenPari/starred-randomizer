import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { RowDataPacket } from 'mysql2/promise';
import { fetchAllStarred } from '../services/github';
import { isValidGithubUsername } from '../utils/validation';
import { getGithubErrorMessage } from '../utils/errors';

interface DbUserToken {
  github_token: string | null;
}

async function getUserToken(app: FastifyInstance, userId: string | null): Promise<string | undefined> {
  if (!userId) return undefined;
  const [rows] = await app.db.query<RowDataPacket[]>('SELECT github_token FROM users WHERE id = ?', [userId]);
  return (rows[0] as DbUserToken | undefined)?.github_token ?? undefined;
}

export async function starredRoutes(app: FastifyInstance) {
  app.get('/api/starred/:username', async (request: FastifyRequest<{ Params: { username: string } }>, reply: FastifyReply) => {
    const { username } = request.params;

    console.log(`[INFO] Request for username: ${username}`);

    if (!isValidGithubUsername(username)) {
      console.warn(`[WARN] Invalid username format: ${username}`);
      return reply.status(400).send({ error: 'Formato username non valido' });
    }

    const token = await getUserToken(app, request.userId);
    const result = await fetchAllStarred(username, token);

    if (!result.ok) {
      return reply.status(result.status).send({
        error: getGithubErrorMessage(result.status),
      });
    }

    return result.data;
  });
}
