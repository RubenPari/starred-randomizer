import { IconClock, IconTrash, IconStar } from './Icons';
import LanguageBadge from './LanguageBadge';
import { formatStars, formatTime } from '../utils/format';
import type { Repo } from '../types';

interface HistoryEntry {
  repo: Repo;
  timestamp: number;
}

interface HistoryPanelProps {
  history: HistoryEntry[];
  onSelectEntry: (entry: HistoryEntry) => void;
  onClear: () => void;
}

export default function HistoryPanel({ history, onSelectEntry, onClear }: HistoryPanelProps) {
  if (history.length <= 1) return null;

  return (
    <div className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-surface-3/50 shadow-lg animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-primary">
          <span className="p-1.5 rounded-lg bg-surface-2">
            <IconClock className="w-4 h-4 text-muted" />
          </span>
          Cronologia
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 font-medium text-muted">
            {history.length}
          </span>
        </h2>
        <button
          onClick={onClear}
          className="text-xs px-3 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 hover:text-red-400 transition-colors flex items-center gap-1.5 min-h-[36px] focus:outline-none focus:ring-2 focus:ring-brand/50 text-secondary"
          aria-label="Cancella cronologia"
        >
          <IconTrash className="w-3.5 h-3.5" /> Cancella
        </button>
      </div>
      <ul className="space-y-2">
        {history.slice(1).map((entry, i) => (
          <li
            key={`${entry.repo.full_name}-${entry.timestamp}-${i}`}
            className="flex items-center justify-between text-sm p-3 rounded-lg hover:bg-surface-2/50 transition-colors cursor-pointer animate-slide-in-right group"
            style={{ animationDelay: `${i * 50}ms` }}
            onClick={() => onSelectEntry(entry)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectEntry(entry);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Vedi ${entry.repo.full_name}`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="truncate font-medium group-hover:text-brand transition-colors text-secondary">
                {entry.repo.full_name}
              </span>
              <LanguageBadge language={entry.repo.language} />
            </div>
            <div className="flex items-center gap-3 whitespace-nowrap ml-2">
              <span className="flex items-center gap-1 text-xs text-muted">
                {formatTime(entry.timestamp)}
              </span>
              <span className="flex items-center gap-1 text-sm font-medium text-star">
                <IconStar className="w-3.5 h-3.5" />
                {formatStars(entry.repo.stargazers_count)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
