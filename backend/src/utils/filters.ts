import type { Repo } from '../types';

export interface RepoFilters {
  language?: string;
  min_stars?: number;
}

export function filterRepos(repos: Repo[], filters: RepoFilters): Repo[] {
  let filtered = repos;

  if (filters.language) {
    const lang = filters.language.toLowerCase();
    filtered = filtered.filter((r) => r.language?.toLowerCase() === lang);
  }

  if (filters.min_stars && filters.min_stars > 0) {
    filtered = filtered.filter((r) => r.stargazers_count >= filters.min_stars!);
  }

  return filtered;
}
