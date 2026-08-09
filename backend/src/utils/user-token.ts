import type { FastifyInstance } from 'fastify';

interface DbUserToken {
  github_token: string | null;
}

export async function getUserToken(app: FastifyInstance, userId: string | null): Promise<string | undefined> {
  if (!userId) return undefined;
  const { rows } = await app.db.query('SELECT github_token FROM users WHERE id = $1', [userId]);
  return (rows[0] as DbUserToken | undefined)?.github_token ?? undefined;
}