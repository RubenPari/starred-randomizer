import type { Repo } from '../types';

export interface RepoFilters {
  language?: string;
  min_stars?: number;
  topic?: string;
  include_archived?: boolean;
  updated_after?: string;
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

  if (filters.topic) {
    const topic = filters.topic.toLowerCase();
    filtered = filtered.filter((r) => r.topics.some((t) => t.toLowerCase() === topic));
  }

  if (filters.include_archived === false) {
    filtered = filtered.filter((r) => !r.archived);
  }

  if (filters.updated_after) {
    const threshold = new Date(filters.updated_after);
    if (!Number.isNaN(threshold.getTime())) {
      filtered = filtered.filter((r) => new Date(r.updated_at) >= threshold);
    }
  }

  return filtered;
}
