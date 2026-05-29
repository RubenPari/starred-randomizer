import type { RepoStats } from '../types';
import { IconChart, IconStar, IconRepo, IconArchive } from './Icons';
import { formatStars } from '../utils/format';

interface StatsDashboardProps {
  stats: RepoStats | null;
  loading: boolean;
  error: string | null;
  onFetch: () => void;
}

export default function StatsDashboard({ stats, loading, error, onFetch }: StatsDashboardProps) {
  if (!stats && !loading) return null;

  return (
    <div className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-surface-3/50 shadow-lg animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-primary">
          <span className="p-1.5 rounded-lg bg-brand/10">
            <IconChart className="w-4 h-4 text-brand" />
          </span>
          Statistiche
        </h2>
        <button
          onClick={onFetch}
          disabled={loading}
          className="text-xs px-3 py-2 bg-brand/10 hover:bg-brand/20 rounded-lg transition-colors font-medium text-brand min-h-[36px] disabled:opacity-50"
        >
          {loading ? 'Caricamento...' : 'Aggiorna'}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}

      {stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-surface-2">
              <div className="flex items-center justify-center gap-1 text-brand mb-1">
                <IconRepo className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-primary">{stats.totalRepos}</div>
              <div className="text-xs text-muted">Repo starred</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-surface-2">
              <div className="flex items-center justify-center gap-1 text-star mb-1">
                <IconStar className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-primary">{formatStars(stats.totalStars)}</div>
              <div className="text-xs text-muted">Stelle totali</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-surface-2">
              <div className="flex items-center justify-center gap-1 text-muted mb-1">
                <IconArchive className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-primary">{stats.archivedCount}</div>
              <div className="text-xs text-muted">Archiviati</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-secondary mb-2">Linguaggi</h3>
            <div className="space-y-1">
              {stats.languages.slice(0, 8).map((lang) => (
                <div key={lang.language} className="flex items-center gap-3 text-sm">
                  <span className="w-24 truncate text-primary">{lang.language}</span>
                  <div className="flex-1 bg-surface-3 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-brand/70 rounded-full transition-all"
                      style={{ width: `${(lang.count / stats.totalRepos) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted w-8 text-right">{lang.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-secondary mb-2">Attività mensile (ultimi 12 mesi)</h3>
            <div className="flex items-end gap-1 h-24">
              {stats.monthlyActivity.slice(-12).map((month) => {
                const maxCount = stats.monthlyActivity.slice(-12).reduce((max, m) => Math.max(max, m.count), 1);
                const height = (month.count / maxCount) * 100;
                return (
                  <div
                    key={month.date}
                    className="flex-1 bg-brand/50 hover:bg-brand rounded-t transition-colors relative group"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-surface rounded text-xs text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {month.date}: {month.count}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>{stats.monthlyActivity.slice(-12)[0]?.date}</span>
              <span>{stats.monthlyActivity.slice(-1).at(0)?.date}</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-secondary mb-2">Topic più comuni</h3>
            <div className="flex flex-wrap gap-1.5">
              {stats.topTopics.slice(0, 15).map((topic) => (
                <span
                  key={topic.topic}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-brand/10 text-brand"
                >
                  {topic.topic} ({topic.count})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
