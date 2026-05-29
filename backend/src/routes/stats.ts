import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { validateAndFetch } from '../utils/validate-and-fetch';
import { config } from '../config';

interface StarActivity {
  date: string;
  count: number;
}

interface LanguageStat {
  language: string;
  count: number;
  totalStars: number;
}

interface TimelineStats {
  totalRepos: number;
  totalStars: number;
  avgStars: number;
  languages: LanguageStat[];
  repoCreationActivity: StarActivity[];
  monthlyActivity: StarActivity[];
  topTopics: { topic: string; count: number }[];
  archivedCount: number;
}

export async function statsRoutes(app: FastifyInstance) {
  app.get('/api/stats/:username', async (request: FastifyRequest<{ Params: { username: string } }>, reply: FastifyReply) => {
    const result = await validateAndFetch(app, request, reply);
    if (!result) return;

    const repos = result.data;
    const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);

    const languageMap = new Map<string, { count: number; totalStars: number }>();
    for (const repo of repos) {
      if (repo.language) {
        const existing = languageMap.get(repo.language) ?? { count: 0, totalStars: 0 };
        existing.count++;
        existing.totalStars += repo.stargazers_count;
        languageMap.set(repo.language, existing);
      }
    }

    const languages: LanguageStat[] = Array.from(languageMap.entries())
      .map(([language, data]) => ({ language, ...data }))
      .sort((a, b) => b.count - a.count);

    const monthlyMap = new Map<string, number>();
    for (const repo of repos) {
      const date = repo.created_at.slice(0, 7);
      monthlyMap.set(date, (monthlyMap.get(date) ?? 0) + 1);
    }

    const monthlyActivity: StarActivity[] = Array.from(monthlyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const dailyMap = new Map<string, number>();
    for (const repo of repos) {
      const date = repo.created_at.slice(0, 10);
      dailyMap.set(date, (dailyMap.get(date) ?? 0) + 1);
    }

    const repoCreationActivity: StarActivity[] = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topicMap = new Map<string, number>();
    for (const repo of repos) {
      for (const topic of repo.topics) {
        topicMap.set(topic, (topicMap.get(topic) ?? 0) + 1);
      }
    }

    const topTopics = Array.from(topicMap.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, config.topTopicsLimit);

    const archivedCount = repos.filter((r) => r.archived).length;

    const stats: TimelineStats = {
      totalRepos: repos.length,
      totalStars,
      avgStars: repos.length > 0 ? Math.round(totalStars / repos.length) : 0,
      languages,
      repoCreationActivity,
      monthlyActivity,
      topTopics,
      archivedCount,
    };

    return stats;
  });
}