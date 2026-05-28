import { useState, useCallback, useEffect } from 'react';
import type { Repo } from '../types';

const STORAGE_KEY = 'starred-randomizer-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Repo[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = useCallback((repo: Repo) => {
    setFavorites((prev) => {
      if (prev.some((r) => r.full_name === repo.full_name)) return prev;
      return [...prev, repo];
    });
  }, []);

  const removeFavorite = useCallback((fullName: string) => {
    setFavorites((prev) => prev.filter((r) => r.full_name !== fullName));
  }, []);

  const isFavorite = useCallback(
    (fullName: string) => favorites.some((r) => r.full_name === fullName),
    [favorites]
  );

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return { favorites, addFavorite, removeFavorite, isFavorite, clearFavorites };
}
