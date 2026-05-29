import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { validateAndFetch } from '../utils/validate-and-fetch';

export async function starredRoutes(app: FastifyInstance) {
  app.get('/api/starred/:username', async (request: FastifyRequest<{ Params: { username: string } }>, reply: FastifyReply) => {
    const result = await validateAndFetch(app, request, reply);
    if (!result) return;

    return result.data;
  });
}