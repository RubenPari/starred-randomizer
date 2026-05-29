import type { FastifyInstance } from 'fastify';
import type { RowDataPacket } from 'mysql2/promise';

interface DbUserToken {
  github_token: string | null;
}

export async function getUserToken(app: FastifyInstance, userId: string | null): Promise<string | undefined> {
  if (!userId) return undefined;
  const [rows] = await app.db.query<RowDataPacket[]>('SELECT github_token FROM users WHERE id = ?', [userId]);
  return (rows[0] as DbUserToken | undefined)?.github_token ?? undefined;
}