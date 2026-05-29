import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import crypto from 'crypto';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { Repo } from '../types';

interface FavoriteBody {
  repo: Repo;
}

interface DbFavorite {
  id: string;
  repo_json: string;
  created_at: string;
}

export async function favoritesRoutes(app: FastifyInstance) {
  app.get('/api/favorites', async (request: FastifyRequest, reply: FastifyReply) => {
    await app.requireAuth(request, reply);
    const userId = request.userId!;
    const [rows] = await app.db.query<RowDataPacket[]>('SELECT id, repo_json, created_at FROM favorites WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return (rows as DbFavorite[]).map((r) => ({
      id: r.id,
      repo: JSON.parse(r.repo_json) as Repo,
      created_at: r.created_at,
    }));
  });

  app.post('/api/favorites', async (request: FastifyRequest, reply: FastifyReply) => {
    await app.requireAuth(request, reply);
    const userId = request.userId!;
    const body = request.body as FavoriteBody;
    const repo = body.repo;

    if (!repo || !repo.full_name) {
      return reply.status(400).send({ error: 'Repository non valido' });
    }

    const [existingRows] = await app.db.query<RowDataPacket[]>('SELECT 1 FROM favorites WHERE user_id = ? AND full_name = ?', [userId, repo.full_name]);
    if (existingRows.length > 0) {
      return reply.status(409).send({ error: 'Già nei preferiti' });
    }

    const id = crypto.randomUUID();
    await app.db.execute('INSERT INTO favorites (id, user_id, full_name, repo_json) VALUES (?, ?, ?, ?)', [id, userId, repo.full_name, JSON.stringify(repo)]);

    reply.status(201);
    return { id, repo };
  });

  app.delete('/api/favorites/:fullName', async (request: FastifyRequest, reply: FastifyReply) => {
    await app.requireAuth(request, reply);
    const userId = request.userId!;
    const params = request.params as { fullName: string };
    const { fullName } = params;
    const [result] = await app.db.execute<ResultSetHeader>('DELETE FROM favorites WHERE user_id = ? AND full_name = ?', [userId, fullName]);

    if (result.affectedRows === 0) {
      return reply.status(404).send({ error: 'Preferito non trovato' });
    }

    return { message: 'Rimosso dai preferiti' };
  });
}
