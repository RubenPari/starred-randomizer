import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import crypto from 'crypto';
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

    const { rows } = await app.db.query('SELECT id, repo_json, created_at FROM favorites WHERE user_id = $1 ORDER BY created_at DESC', [request.userId]);
    return (rows as DbFavorite[]).map((r) => ({
      id: r.id,
      repo: JSON.parse(r.repo_json) as Repo,
      created_at: r.created_at,
    }));
  });

  app.post('/api/favorites', async (request: FastifyRequest, reply: FastifyReply) => {
    await app.requireAuth(request, reply);

    const body = request.body as FavoriteBody;
    const repo = body.repo;

    if (!repo || !repo.full_name) {
      return reply.status(400).send({ error: 'Repository non valido' });
    }

    const { rows: existingRows } = await app.db.query('SELECT 1 FROM favorites WHERE user_id = $1 AND full_name = $2', [request.userId, repo.full_name]);
    if (existingRows.length > 0) {
      return reply.status(409).send({ error: 'Già nei preferiti' });
    }

    const id = crypto.randomUUID();
    await app.db.query('INSERT INTO favorites (id, user_id, full_name, repo_json) VALUES ($1, $2, $3, $4)', [id, request.userId, repo.full_name, JSON.stringify(repo)]);

    reply.status(201);
    return { id, repo };
  });

  app.delete('/api/favorites/*', async (request: FastifyRequest, reply: FastifyReply) => {
    await app.requireAuth(request, reply);

    const params = request.params as Record<string, string>;
    const fullName = decodeURIComponent(params['*']);
    if (!fullName) {
      return reply.status(400).send({ error: 'fullName richiesto' });
    }

    const { rowCount } = await app.db.query('DELETE FROM favorites WHERE user_id = $1 AND full_name = $2', [request.userId, fullName]);

    if (rowCount === 0) {
      return reply.status(404).send({ error: 'Preferito non trovato' });
    }

    return { message: 'Rimosso dai preferiti' };
  });
}