import { IconHeart, IconTrash, IconStar, IconExternalLink } from './Icons';
import LanguageBadge from './LanguageBadge';
import { formatStars } from '../utils/format';
import type { Repo } from '../types';

interface FavoritesPanelProps {
  favorites: Repo[];
  onRemove: (fullName: string) => void;
  onClear: () => void;
  onSelect: (repo: Repo) => void;
}

export default function FavoritesPanel({ favorites, onRemove, onClear, onSelect }: FavoritesPanelProps) {
  if (favorites.length === 0) return null;

  return (
    <div className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-red-400/20 shadow-lg animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-primary">
          <span className="p-1.5 rounded-lg bg-red-400/10">
            <IconHeart className="w-4 h-4 text-red-400" />
          </span>
          Preferiti
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-400/10 font-medium text-red-400">
            {favorites.length}
          </span>
        </h2>
        <button
          onClick={onClear}
          className="text-xs px-3 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 hover:text-red-400 transition-colors flex items-center gap-1.5 min-h-[36px] focus:outline-none focus:ring-2 focus:ring-brand/50 text-secondary"
          aria-label="Cancella preferiti"
        >
          <IconTrash className="w-3.5 h-3.5" /> Cancella
        </button>
      </div>
      <ul className="space-y-2">
        {favorites.map((repo) => (
          <li
            key={repo.full_name}
            className="flex items-center justify-between text-sm p-3 rounded-lg hover:bg-surface-2/50 transition-colors group"
          >
            <div
              className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
              onClick={() => onSelect(repo)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(repo);
                }
              }}
            >
              <span className="truncate font-medium text-secondary group-hover:text-brand transition-colors">
                {repo.full_name}
              </span>
              <LanguageBadge language={repo.language} />
            </div>
            <div className="flex items-center gap-2 ml-2">
              <span className="flex items-center gap-1 text-xs text-star">
                <IconStar className="w-3 h-3" />
                {formatStars(repo.stargazers_count)}
              </span>
              <div className="flex items-center gap-1">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded hover:bg-surface-3 transition-colors text-muted hover:text-brand"
                  aria-label="Apri repository"
                >
                  <IconExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => onRemove(repo.full_name)}
                  className="p-1.5 rounded hover:bg-surface-3 transition-colors text-muted hover:text-red-400"
                  aria-label="Rimuovi dai preferiti"
                >
                  <IconHeart className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
