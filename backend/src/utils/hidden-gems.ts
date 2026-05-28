import type { Repo } from '../types';

export interface HiddenGemScore {
  repo: Repo;
  score: number;
  breakdown: {
    recencyScore: number;
    popularityScore: number;
    engagementScore: number;
  };
}

export function calculateHiddenGemScore(repos: Repo[]): HiddenGemScore[] {
  if (repos.length === 0) return [];

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneYear = 365 * oneDay;

  const maxStars = Math.max(...repos.map((r) => r.stargazers_count), 1);
  const maxForks = Math.max(...repos.map((r) => r.forks_count ?? 0), 1);
  const maxWatchers = Math.max(...repos.map((r) => r.watchers_count ?? 0), 1);

  return repos
    .map((repo) => {
      const updatedDaysAgo = (now - new Date(repo.updated_at).getTime()) / oneDay;
      const createdDaysAgo = (now - new Date(repo.created_at).getTime()) / oneDay;

      const recencyScore = Math.max(0, 1 - updatedDaysAgo / oneYear);
      const popularityScore = 1 - repo.stargazers_count / maxStars;
      const engagementScore =
        (repo.forks_count ?? 0) / maxForks * 0.5 +
        (repo.watchers_count ?? 0) / maxWatchers * 0.5;

      const score =
        recencyScore * 0.35 +
        popularityScore * 0.4 +
        engagementScore * 0.25;

      return {
        repo,
        score: Math.round(score * 1000) / 1000,
        breakdown: {
          recencyScore: Math.round(recencyScore * 100) / 100,
          popularityScore: Math.round(popularityScore * 100) / 100,
          engagementScore: Math.round(engagementScore * 100) / 100,
        },
      };
    })
    .sort((a, b) => b.score - a.score);
}
