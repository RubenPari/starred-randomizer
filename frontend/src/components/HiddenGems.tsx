import { useState, useCallback } from 'react';
import type { HiddenGemScore } from '../types';
import { IconGem, IconStar, IconFork, IconEye } from './Icons';
import { formatStars } from '../utils/format';

interface HiddenGemsProps {
  gems: HiddenGemScore[];
  loading: boolean;
  error: string | null;
  onFetch: () => void;
  onSelect: (repo: HiddenGemScore['repo']) => void;
}

export default function HiddenGems({ gems, loading, error, onFetch, onSelect }: HiddenGemsProps) {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleSelect = useCallback((gem: HiddenGemScore) => {
    onSelect(gem.repo);
  }, [onSelect]);

  return (
    <div className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-accent/30 shadow-lg animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-accent/10">
            <IconGem className="w-4 h-4 text-accent" />
          </span>
          <h2 className="text-lg font-semibold text-primary">Hidden Gems</h2>
        </div>
        <button
          onClick={onFetch}
          disabled={loading}
          className="text-xs px-3 py-2 bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors font-medium text-accent min-h-[36px] disabled:opacity-50"
        >
          {loading ? 'Analisi...' : 'Scopri'}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}

      {gems.length > 0 && (
        <>
          <p className="text-sm text-secondary mb-3">
            {gems.length} repo promettenti con poche stelle ma alto potenziale
          </p>
          <div className="space-y-2">
            {(expanded ? gems : gems.slice(0, 3)).map((gem) => (
              <div
                key={gem.repo.full_name}
                className="flex items-center justify-between text-sm p-3 rounded-lg hover:bg-surface-2/50 transition-colors cursor-pointer group"
                onClick={() => handleSelect(gem)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(gem);
                  }
                }}
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-secondary group-hover:text-brand transition-colors truncate block">
                    {gem.repo.full_name}
                  </span>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <IconStar className="w-3 h-3 text-star" /> {formatStars(gem.repo.stargazers_count)}
                    </span>
                    <span className="flex items-center gap-1">
                      <IconFork className="w-3 h-3" /> {gem.repo.forks_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <IconEye className="w-3 h-3" /> {gem.repo.watchers_count}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">
                      {(gem.score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {gems.length > 3 && (
            <button
              onClick={handleToggle}
              className="w-full text-center text-xs text-brand hover:text-brand/80 transition-colors mt-3 py-2"
            >
              {expanded ? 'Mostra meno' : `Mostra altri ${gems.length - 3}`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
