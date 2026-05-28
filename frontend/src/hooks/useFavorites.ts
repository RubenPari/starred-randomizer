import { useState, useCallback, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import type { Repo } from '../types';

const STORAGE_KEY = 'starred-randomizer-favorites';

interface FavoriteEntry {
  id: string;
  repo: Repo;
  created_at: string;
}

export function useFavorites() {
  const { user } = useContext(AuthContext);
  const [favorites, setFavorites] = useState<Repo[]>(() => {
    if (!user) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const loadFavorites = useCallback(async () => {
    if (!user) {
      const stored = localStorage.getItem(STORAGE_KEY);
      setFavorites(stored ? JSON.parse(stored) : []);
      return;
    }
    try {
      const res = await axios.get<FavoriteEntry[]>('/api/favorites');
      setFavorites(res.data.map((e) => e.repo));
    } catch {
      setFavorites([]);
    }
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }
  }, [favorites, user]);

  const addFavorite = useCallback(async (repo: Repo) => {
    if (favorites.some((r) => r.full_name === repo.full_name)) return;

    if (user) {
      try {
        await axios.post('/api/favorites', { repo });
        setFavorites((prev) => [...prev, repo]);
      } catch {
        // fallback to local
        setFavorites((prev) => [...prev, repo]);
      }
    } else {
      setFavorites((prev) => [...prev, repo]);
    }
  }, [user, favorites]);

  const removeFavorite = useCallback(async (fullName: string) => {
    if (user) {
      try {
        await axios.delete(`/api/favorites/${encodeURIComponent(fullName)}`);
      } catch {
        // continue anyway
      }
    }
    setFavorites((prev) => prev.filter((r) => r.full_name !== fullName));
  }, [user]);

  const isFavorite = useCallback(
    (fullName: string) => favorites.some((r) => r.full_name === fullName),
    [favorites]
  );

  const clearFavorites = useCallback(async () => {
    if (user) {
      const promises = favorites.map((r) => axios.delete(`/api/favorites/${encodeURIComponent(r.full_name)}`));
      await Promise.allSettled(promises);
    }
    setFavorites([]);
  }, [user, favorites]);

  return { favorites, addFavorite, removeFavorite, isFavorite, clearFavorites, refreshFavorites: loadFavorites };
}
