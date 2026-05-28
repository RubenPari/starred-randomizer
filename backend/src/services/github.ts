import fetch from 'node-fetch';
import { config } from '../config';
import type { Repo, GithubApiResponse, GithubApiError } from '../types';

interface CacheEntry {
  data: Repo[];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

function getCacheKey(username: string): string {
  return `starred:${username.toLowerCase()}`;
}

function getCached(username: string): Repo[] | null {
  const key = getCacheKey(username);
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > config.cacheTtlMs) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCache(username: string, data: Repo[]): void {
  const key = getCacheKey(username);
  cache.set(key, { data, timestamp: Date.now() });
}

async function fetchWithTimeout(url: string, controller: AbortController): Promise<import('node-fetch').Response> {
  const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  try {
    return await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.githubToken}`,
        'User-Agent': 'starred-randomizer',
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchStarredPage(username: string, page: number): Promise<GithubApiResponse | GithubApiError> {
  const url = `${config.githubApiBaseUrl}/users/${username}/starred?page=${page}&per_page=${config.perPage}`;
  const controller = new AbortController();

  console.log(`[DEBUG] Fetching: ${url}`);

  const res = await fetchWithTimeout(url, controller);

  console.log(`[DEBUG] GitHub API response: ${res.status}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error(`[ERROR] GitHub API error ${res.status}:`, JSON.stringify(body));
    return { ok: false, status: res.status ?? 500, body };
  }

  const linkHeader = res.headers.get('link') || '';
  const hasNext = linkHeader.includes('rel="next"');

  const data = await res.json();
  console.log(`[DEBUG] Retrieved ${Array.isArray(data) ? data.length : 0} repositories${hasNext ? ' (has next page)' : ' (last page)'}`);

  return { ok: true, data: data as Repo[], hasNext };
}

export async function fetchAllStarred(username: string): Promise<{ ok: false; status: number; body: unknown } | { ok: true; data: Repo[] }> {
  const cached = getCached(username);
  if (cached) {
    console.log(`[INFO] Cache hit for ${username}, returning ${cached.length} repos`);
    return { ok: true, data: cached };
  }

  let page = 1;
  let allRepos: Repo[] = [];

  while (page <= config.maxPages) {
    const result = await fetchStarredPage(username, page);

    if (!result.ok) {
      if (allRepos.length > 0) {
        console.warn(`[WARN] Error on page ${page}, returning ${allRepos.length} repos fetched so far`);
        setCache(username, allRepos);
        return { ok: true, data: allRepos };
      }
      return result;
    }

    allRepos = allRepos.concat(result.data);
    console.log(`[INFO] Fetched page ${page}: ${result.data.length} repos (total: ${allRepos.length})`);

    if (!result.hasNext) {
      break;
    }

    page++;
  }

  if (page > config.maxPages) {
    console.warn(`[WARN] Reached max pages limit (${config.maxPages})`);
  }

  setCache(username, allRepos);
  return { ok: true, data: allRepos };
}

export function invalidateCache(username: string): void {
  cache.delete(getCacheKey(username));
}

export function getCacheStats(): { size: number; keys: string[] } {
  return { size: cache.size, keys: Array.from(cache.keys()) };
}
