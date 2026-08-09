import { useEffect, useState, useCallback, useRef } from 'react';
import type { Repo } from '../types';
import LanguageBadge from './LanguageBadge';
import { IconStar } from './Icons';
import { formatStars } from '../utils/format';

const SHUFFLE_COUNT = 10;
const SHUFFLE_INTERVAL = 90;
const SHUFFLE_FINAL_DELAY = 250;
const TRAIL_LENGTH = 4;

interface ShuffleAnimationProps {
  filteredRepos: Repo[];
}

export default function ShuffleAnimation({ filteredRepos }: ShuffleAnimationProps) {
  const [trail, setTrail] = useState<Repo[]>([]);
  const [settled, setSettled] = useState(false);
  const cancelledRef = useRef(false);

  const runShuffle = useCallback(async () => {
    if (filteredRepos.length === 0) return;
    cancelledRef.current = false;
    setSettled(false);

    const randomIndex = Math.floor(Math.random() * filteredRepos.length);
    const finalRepo = filteredRepos[randomIndex];

    for (let i = 0; i < SHUFFLE_COUNT; i++) {
      if (cancelledRef.current) return;
      const idx = Math.floor(Math.random() * filteredRepos.length);
      setTrail((prev) => [filteredRepos[idx], ...prev].slice(0, TRAIL_LENGTH));
      await new Promise((resolve) => setTimeout(resolve, SHUFFLE_INTERVAL));
    }

    if (cancelledRef.current) return;
    setTrail((prev) => [finalRepo, ...prev].slice(0, TRAIL_LENGTH));
    setSettled(true);
    await new Promise((resolve) => setTimeout(resolve, SHUFFLE_FINAL_DELAY));
  }, [filteredRepos]);

  useEffect(() => {
    runShuffle();
    return () => {
      cancelledRef.current = true;
    };
  }, [runShuffle]);

  if (trail.length === 0) return null;

  const [current, ...rest] = trail;

  return (
    <div className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-brand/30 shadow-lg overflow-hidden">
      <div className="flex items-center gap-3 mb-3">
        <span className="spinner" />
        <span className="text-sm font-medium text-muted">
          {settled ? 'Estratto!' : 'Selezione in corso...'}
        </span>
      </div>
      <div className="relative">
        <div key={current.full_name + trail.length} className="animate-fade-in">
          <h3 className="text-lg font-bold mb-1 text-primary">{current.full_name}</h3>
          <div className="flex items-center gap-3">
            <LanguageBadge language={current.language} />
            <span className="flex items-center gap-1 text-sm font-medium text-star">
              <IconStar className="w-3.5 h-3.5" />
              {formatStars(current.stargazers_count)}
            </span>
          </div>
        </div>
        {!settled && rest.length > 0 && (
          <div className="mt-2 space-y-1 opacity-40">
            {rest.map((repo, i) => (
              <p
                key={repo.full_name + i}
                className="text-xs text-muted truncate"
                style={{ opacity: 1 - i * 0.22 }}
              >
                {repo.full_name}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
