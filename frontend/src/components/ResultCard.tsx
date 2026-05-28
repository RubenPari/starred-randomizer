import { forwardRef } from 'react';
import type { Repo } from '../types';
import { IconDice, IconStar, IconCalendar, IconExternalLink, IconRefresh, IconGitHub, IconHeart } from './Icons';
import LanguageBadge from './LanguageBadge';
import { formatStars, timeAgo } from '../utils/format';

interface ResultCardProps {
  repo: Repo;
  loading: boolean;
  onReroll: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const ResultCard = forwardRef<HTMLDivElement, ResultCardProps>(
  ({ repo, loading, onReroll, isFavorite, onToggleFavorite }, ref) => {
    return (
      <div
        ref={ref}
        className="bg-surface/80 backdrop-blur rounded-xl border border-brand/30 shadow-xl animate-scale-in animate-glow-pulse"
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-primary">
              <span className="p-1.5 rounded-lg bg-brand/10">
                <IconDice className="w-4 h-4 text-brand" />
              </span>
              Repository Estratto
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleFavorite}
                className={`p-2 rounded-lg transition-colors min-h-[36px] ${
                  isFavorite
                    ? 'bg-red-400/10 text-red-400 hover:bg-red-400/20'
                    : 'bg-surface-2 text-muted hover:bg-surface-3 hover:text-red-400'
                }`}
                aria-label={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
              >
                <IconHeart className="w-4 h-4" />
              </button>
              <button
                onClick={onReroll}
                disabled={loading}
                className="text-xs px-3 py-2 bg-surface-2 hover:bg-surface-3 rounded-lg transition-colors flex items-center gap-1.5 min-h-[36px] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand/50 text-secondary"
                aria-label="Re-estrai repository"
              >
                <IconRefresh className="w-3.5 h-3.5" /> Re-estrai
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0 border border-surface-3 overflow-hidden"
              style={{ backgroundImage: `url(${repo.owner?.avatar_url})`, backgroundSize: 'cover' }}
            >
              {!repo.owner?.avatar_url && (
                <IconGitHub className="w-5 h-5 text-muted" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-bold truncate text-primary">{repo.full_name}</h3>
              <a
                href={repo.owner?.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:text-brand transition-colors text-muted"
              >
                @{repo.owner?.login ?? repo.full_name.split('/')[0]}
              </a>
            </div>
          </div>

          {repo.description && (
            <p className="text-sm mb-4 leading-relaxed text-secondary">{repo.description}</p>
          )}

          {repo.topics && repo.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {repo.topics.slice(0, 5).map((topic) => (
                <span
                  key={topic}
                  className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand hover:bg-brand/20 transition-colors cursor-default"
                >
                  {topic}
                </span>
              ))}
              {repo.topics.length > 5 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-2 text-muted">
                  +{repo.topics.length - 5}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <LanguageBadge language={repo.language} size="md" />
            <span className="flex items-center gap-1.5 text-sm font-medium text-star">
              <IconStar className="w-4 h-4" />
              {formatStars(repo.stargazers_count)}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <IconCalendar className="w-3.5 h-3.5" />
              Aggiornato {timeAgo(repo.updated_at, true)}
            </span>
          </div>

          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand/10 hover:bg-brand/20 rounded-xl transition-colors font-medium min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand/50 text-brand"
          >
            <IconExternalLink className="w-4 h-4" />
            Vai al repository
          </a>
        </div>
      </div>
    );
  }
);

ResultCard.displayName = 'ResultCard';

export default ResultCard;
