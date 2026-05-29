import { useEffect, useState, useCallback, useRef } from 'react';
import type { Repo } from '../types';
import LanguageBadge from './LanguageBadge';
import { IconStar } from './Icons';
import { formatStars } from '../utils/format';

const SHUFFLE_COUNT = 6;
const SHUFFLE_INTERVAL = 120;
const SHUFFLE_FINAL_DELAY = 200;

interface ShuffleAnimationProps {
  filteredRepos: Repo[];
}

export default function ShuffleAnimation({ filteredRepos }: ShuffleAnimationProps) {
  const [currentRepo, setCurrentRepo] = useState<Repo | null>(null);
  const cancelledRef = useRef(false);

  const runShuffle = useCallback(async () => {
    if (filteredRepos.length === 0) return;
    cancelledRef.current = false;

    const randomIndex = Math.floor(Math.random() * filteredRepos.length);
    const finalRepo = filteredRepos[randomIndex];

    for (let i = 0; i < SHUFFLE_COUNT; i++) {
      if (cancelledRef.current) return;
      const idx = Math.floor(Math.random() * filteredRepos.length);
      setCurrentRepo(filteredRepos[idx]);
      await new Promise((resolve) => setTimeout(resolve, SHUFFLE_INTERVAL));
    }

    if (cancelledRef.current) return;
    setCurrentRepo(finalRepo);
    await new Promise((resolve) => setTimeout(resolve, SHUFFLE_FINAL_DELAY));
  }, [filteredRepos]);

  useEffect(() => {
    runShuffle();
    return () => {
      cancelledRef.current = true;
    };
  }, [runShuffle]);

  if (!currentRepo) return null;

  return (
    <div className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-brand/30 shadow-lg animate-shuffle-pulse">
      <div className="flex items-center gap-3 mb-3">
        <span className="spinner" />
        <span className="text-sm font-medium text-muted">Selezione in corso...</span>
      </div>
      <div className="animate-fade-in">
        <h3 className="text-lg font-bold mb-1 text-primary">{currentRepo.full_name}</h3>
        <div className="flex items-center gap-3">
          <LanguageBadge language={currentRepo.language} />
          <span className="flex items-center gap-1 text-sm font-medium text-star">
            <IconStar className="w-3.5 h-3.5" />
            {formatStars(currentRepo.stargazers_count)}
          </span>
        </div>
      </div>
    </div>
  );
}