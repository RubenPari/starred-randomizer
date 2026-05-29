import { config } from '../config';
import type { Repo, GithubApiResponse, GithubApiError } from '../types';

export type FetchAllStarredResult =
  | { ok: false; status: number; body: unknown }
  | { ok: true; data: Repo[] };

interface CacheEntry {
  data: Repo[];
  timestamp: number;
  partial?: boolean;
}

const cache = new Map<string, CacheEntry>();

function getCacheKey(username: string, token?: string): string {
  return `starred:${username.toLowerCase()}:${token ? 'custom' : 'global'}`;
}

function getCached(username: string, token?: string): Repo[] | null {
  const key = getCacheKey(username, token);
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > config.cacheTtlMs) {
    cache.delete(key);
    return null;
  }

  if (entry.partial) return null;

  return entry.data;
}

function setCache(username: string, data: Repo[], token?: string, partial = false): void {
  const key = getCacheKey(username, token);
  cache.set(key, { data, timestamp: Date.now(), partial });
}

async function fetchWithTimeout(url: string, controller: AbortController, token?: string): Promise<Response> {
  const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  try {
    return await fetch(url, {
      headers: {
        Authorization: `Bearer ${token || config.githubToken}`,
        'User-Agent': 'starred-randomizer',
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchStarredPage(username: string, page: number, token?: string): Promise<GithubApiResponse | GithubApiError> {
  const url = `${config.githubApiBaseUrl}/users/${username}/starred?page=${page}&per_page=${config.perPage}`;
  const controller = new AbortController();

  console.log(`[INFO] Fetching page ${page} for ${username}`);

  const res = await fetchWithTimeout(url, controller, token);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error(`[ERROR] GitHub API error ${res.status}:`, JSON.stringify(body));
    return { ok: false, status: res.status ?? 500, body };
  }

  const linkHeader = res.headers.get('link') || '';
  const hasNext = linkHeader.includes('rel="next"');

  const data = await res.json();
  const repoCount = Array.isArray(data) ? data.length : 0;

  console.log(`[INFO] Page ${page}: ${repoCount} repos${hasNext ? ' (more pages)' : ' (last page)'}`);

  if (repoCount > 0) {
    console.log(`[DEBUG] Page ${page} range: ${(data as Repo[])[0].full_name} → ${(data as Repo[])[repoCount - 1].full_name}`);
  }

  return { ok: true, data: data as Repo[], hasNext };
}

export async function fetchAllStarred(username: string, token?: string): Promise<FetchAllStarredResult> {
  const cached = getCached(username, token);
  if (cached) {
    console.log(`[INFO] Cache hit for ${username}, returning ${cached.length} repos`);
    return { ok: true, data: cached };
  }

  let page = 1;
  let allRepos: Repo[] = [];
  const seen = new Set<string>();

  while (page <= config.maxPages) {
    const result = await fetchStarredPage(username, page, token);

    if (!result.ok) {
      if (allRepos.length > 0) {
        console.warn(`[WARN] Error on page ${page}, returning ${allRepos.length} repos fetched so far (partial, not cached)`);
        return { ok: true, data: allRepos };
      }
      return result;
    }

    if (result.data.length === 0) {
      console.log(`[INFO] Empty page ${page}, stopping pagination`);
      break;
    }

    let dupeCount = 0;
    const newRepos = result.data.filter((repo) => {
      if (seen.has(repo.full_name)) {
        dupeCount++;
        return false;
      }
      seen.add(repo.full_name);
      return true;
    });

    allRepos = allRepos.concat(newRepos);
    console.log(`[INFO] Page ${page}: ${result.data.length} fetched, ${newRepos.length} new${dupeCount > 0 ? `, ${dupeCount} dupes` : ''} | total: ${allRepos.length}`);

    if (!result.hasNext) {
      break;
    }

    page++;
  }

  if (page > config.maxPages) {
    console.warn(`[WARN] Reached max pages limit (${config.maxPages})`);
  }

  console.log(`[INFO] Finished fetching ${username}: ${allRepos.length} total repos across ${page} page(s)`);

  setCache(username, allRepos, token);
  return { ok: true, data: allRepos };
}

export function invalidateCache(username: string, token?: string): void {
  cache.delete(getCacheKey(username, token));
}

export function getCacheStats(): { size: number; keys: string[] } {
  return { size: cache.size, keys: Array.from(cache.keys()) };
}