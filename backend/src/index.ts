import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
const app: FastifyInstance = Fastify();
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PORT = parseInt(process.env.PORT as string, 10) || 3001;

if (!GITHUB_TOKEN) {
  console.error('[FATAL] GITHUB_TOKEN non è definito nel file .env');
  process.exit(1);
}

interface Repo {
  full_name: string;
  html_url: string;
  description: string;
  language: string | null;
  stargazers_count: number;
  topics: string[];
  updated_at: string;
  created_at: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
}

function isValidGithubUsername(username: string): boolean {
  return /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(username);
}

function getGithubErrorMessage(status: number, body: unknown): string {
  switch (status) {
    case 404:
      return 'Username non trovato su GitHub';
    case 401:
      return 'Token GitHub non valido o scaduto';
    case 403:
      return 'Accesso negato. Verifica il token GitHub o i limiti di rate';
    case 422:
      return 'Username non valido per GitHub';
    default:
      if (status >= 500) return 'Errore server GitHub. Riprova più tardi';
      return `Errore GitHub API (${status})`;
  }
}

async function fetchStarredFromGithub(username: string, page: string, per_page: string): Promise<{ ok: false; status: number; body: unknown } | { ok: true; data: Repo[] }> {
  const url = `https://api.github.com/users/${username}/starred?page=${page}&per_page=${per_page}`;
  console.log(`[DEBUG] Fetching: ${url}`);
  
  const res = await fetch(url, {
    headers: { Authorization: `token ${GITHUB_TOKEN!}`, 'User-Agent': 'starred-randomizer' }
  });

  console.log(`[DEBUG] GitHub API response: ${res.status}`);
  
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error(`[ERROR] GitHub API error ${res.status}:`, JSON.stringify(body));
    return { ok: false, status: res.status ?? 500, body };
  }

  const data = await res.json();
  console.log(`[DEBUG] Retrieved ${Array.isArray(data) ? data.length : 0} repositories`);
  return { ok: true, data: data as Repo[] };
}

async function bootstrap() {
  await app.register(cors, { origin: '*' });

  console.log(`[INFO] GITHUB_TOKEN caricato: ${GITHUB_TOKEN!.slice(0, 7)}...`);
  console.log(`[INFO] Starting server on port ${PORT}`);

  // Recupera starred repos
  app.get('/api/starred/:username', async (request: FastifyRequest<{ Params: { username: string }; Querystring: { page?: string; per_page?: string } }>, reply: FastifyReply) => {
    const { username } = request.params;
    const page = request.query.page ?? '1';
    const per_page = request.query.per_page ?? '100';

    console.log(`[INFO] Request for username: ${username}`);

    if (!isValidGithubUsername(username)) {
      console.warn(`[WARN] Invalid username format: ${username}`);
      return reply.status(400).send({ error: 'Formato username non valido' });
    }

    const result = await fetchStarredFromGithub(username, page, per_page);

    if (!result.ok) {
      return reply.status(result.status).send({
        error: getGithubErrorMessage(result.status, result.body)
      });
    }

    return result.data;
  });

  // Estrai repo casuale con filtri
  app.get('/api/random/:username', async (request: FastifyRequest<{ Params: { username: string }; Querystring: { language?: string; min_stars?: string } }>, reply: FastifyReply) => {
    const { username } = request.params;
    const { language, min_stars } = request.query;

    console.log(`[INFO] Random request for username: ${username}, language: ${language}, min_stars: ${min_stars}`);

    if (!isValidGithubUsername(username)) {
      console.warn(`[WARN] Invalid username format: ${username}`);
      return reply.status(400).send({ error: 'Formato username non valido' });
    }

    const result = await fetchStarredFromGithub(username, '1', '100');

    if (!result.ok) {
      return reply.status(result.status).send({
        error: getGithubErrorMessage(result.status, result.body)
      });
    }

    let repos = result.data;

    if (language) repos = repos.filter(r => r.language?.toLowerCase() === language.toLowerCase());
    if (min_stars) repos = repos.filter(r => r.stargazers_count >= parseInt(min_stars, 10));

    console.log(`[DEBUG] After filters: ${repos.length} repositories`);

    if (!repos.length) return reply.status(404).send({ error: 'Nessun repository trovato con questi filtri' });

    const random = repos[Math.floor(Math.random() * repos.length)];
    console.log(`[INFO] Selected random repo: ${random.full_name}`);
    return random;
  });

  app.listen({ port: PORT }, (err) => {
    if (err) throw err;
    console.log(`Server in ascolto su http://localhost:${PORT}`);
  });
}

bootstrap().catch(err => {
  console.error('[FATAL] Failed to start server:', err);
  throw err;
});