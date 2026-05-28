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
    const userId = request.userId!;
    const rows: DbFavorite[] = app.stmt.getFavorites.all(userId);
    return rows.map((r) => ({
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

    const existing = app.stmt.isFavorite.get(userId, repo.full_name);
    if (existing) {
      return reply.status(409).send({ error: 'GiÃ  nei preferiti' });
    }

    const id = crypto.randomUUID();
    app.stmt.addFavorite.run(id, userId, repo.full_name, JSON.stringify(repo));

    reply.status(201);
    return { id, repo };
  });

  app.delete('/api/favorites/:fullName', async (request: FastifyRequest, reply: FastifyReply) => {
    await app.requireAuth(request, reply);
    const userId = request.userId!;
    const params = request.params as { fullName: string };
    const { fullName } = params;
    const result = app.stmt.removeFavorite.run(userId, fullName);

    if (result.changes === 0) {
      return reply.status(404).send({ error: 'Preferito non trovato' });
    }

    return { message: 'Rimosso dai preferiti' };
  });
}
