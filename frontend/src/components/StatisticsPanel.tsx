import { useState, useMemo } from 'react';
import { IconChart, IconChevronDown, IconStar, IconCode, IconClock } from './Icons';
import LanguageBadge from './LanguageBadge';
import type { Repo } from '../types';
import { formatStars, timeAgo } from '../utils/format';

interface StatisticsPanelProps {
  repos: Repo[];
}

export default function StatisticsPanel({ repos }: StatisticsPanelProps) {
  const [isVisible, setIsVisible] = useState(false);

  const stats = useMemo(() => {
    const languageCount: Record<string, number> = {};
    let totalStars = 0;
    let topRepo = repos[0];
    let mostRecentRepo = repos[0];

    repos.forEach((repo) => {
      if (repo.language) {
        languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
      }
      totalStars += repo.stargazers_count;
      if (repo.stargazers_count > topRepo.stargazers_count) topRepo = repo;
      if (new Date(repo.updated_at) > new Date(mostRecentRepo.updated_at)) mostRecentRepo = repo;
    });

    const languages = Object.entries(languageCount)
      .sort(([, a], [, b]) => b - a)
      .map(([lang, count]) => ({
        name: lang,
        count,
        percentage: Math.round((count / repos.length) * 100),
      }));

    const uniqueLanguages = new Set(repos.map((r) => r.language).filter(Boolean)).size;

    return {
      totalStars,
      topRepo,
      mostRecentRepo,
      languages,
      uniqueLanguages,
      totalRepos: repos.length,
    };
  }, [repos]);

  if (repos.length === 0) return null;

  return (
    <div className="bg-surface/80 backdrop-blur rounded-xl border border-surface-3/50 shadow-lg overflow-hidden animate-fade-in">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-surface-2/50 transition-colors"
        aria-label={isVisible ? 'Nascondi statistiche' : 'Mostra statistiche'}
      >
        <div className="flex items-center gap-2">
          <IconChart className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Statistiche
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
            {stats.totalRepos} repo
          </span>
        </div>
        <IconChevronDown
          className={`w-5 h-5 transition-transform duration-200 ${isVisible ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-muted)' }}
        />
      </button>

      {isVisible && (
        <div className="px-5 pb-5 space-y-5 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-surface-2/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--color-star)' }}>
                {formatStars(stats.totalStars)}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Stelle totali
              </div>
            </div>
            <div className="bg-surface-2/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--color-brand)' }}>
                {stats.uniqueLanguages}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Linguaggi
              </div>
            </div>
            <div className="bg-surface-2/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {stats.topRepo.full_name.split('/')[1]}
              </div>
              <div className="text-xs mt-1 flex items-center justify-center gap-1" style={{ color: 'var(--color-star)' }}>
                <IconStar className="w-3 h-3" />
                {formatStars(stats.topRepo.stargazers_count)}
              </div>
            </div>
            <div className="bg-surface-2/50 rounded-lg p-3 text-center">
              <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {stats.mostRecentRepo.full_name.split('/')[1]}
              </div>
              <div className="text-xs mt-1 flex items-center justify-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <IconClock className="w-3 h-3" />
                {timeAgo(stats.mostRecentRepo.updated_at)}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <IconCode className="w-4 h-4" />
              Distribuzione linguaggi
            </h4>
            <div className="space-y-2">
              {stats.languages.slice(0, 6).map(({ name, count, percentage }) => (
                <div key={name} className="flex items-center gap-3">
                  <LanguageBadge language={name} />
                  <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        background: 'var(--color-brand)',
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium w-12 text-right" style={{ color: 'var(--text-muted)' }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
