import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
const app: FastifyInstance = Fastify();
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const PORT = parseInt(process.env.PORT as string, 10) || 3001;

await app.register(cors, { origin: '*' });

interface Repo {
  full_name: string;
  html_url: string;
  description: string;
  language: string | null;
  stargazers_count: number;
}

// Recupera starred repos
app.get('/api/starred/:username', async (request: FastifyRequest<{ Params: { username: string }; Querystring: { page?: string; per_page?: string } }>, reply: FastifyReply) => {
  const { username } = request.params;
  const page = request.query.page ?? '1';
  const per_page = request.query.per_page ?? '100';
  const url = `https://api.github.com/users/${username}/starred?page=${page}&per_page=${per_page}`;

  const res = await fetch(url, {
    headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'fastify-ts' }
  });

  if (!res.ok) return reply.status(res.status).send({ error: 'Errore GitHub API' });

  const data: Repo[] = await res.json();
  return data;
});

// Estrai repo casuale con filtri
app.get('/api/random/:username', async (request: FastifyRequest<{ Params: { username: string }; Querystring: { language?: string; min_stars?: string } }>, reply: FastifyReply) => {
  const { username } = request.params;
  const { language, min_stars } = request.query;
  const res = await fetch(`https://api.github.com/users/${username}/starred?per_page=100`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'fastify-ts' }
  });
  let repos: Repo[] = await res.json();

  if (language) repos = repos.filter(r => r.language?.toLowerCase() === language.toLowerCase());
  if (min_stars) repos = repos.filter(r => r.stargazers_count >= parseInt(min_stars, 10));

  if (!repos.length) return reply.status(404).send({ error: 'Nessun repository trovato con questi filtri' });

  const random = repos[Math.floor(Math.random() * repos.length)];
  return random;
});

app.listen({ port: PORT }, (err) => {
  if (err) throw err;
  console.log(`Server in ascolto su http://localhost:${PORT}`);
});