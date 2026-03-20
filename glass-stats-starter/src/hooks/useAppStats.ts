'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AppStats, BaseStats } from '@/lib/stats/types';

async function fetchStats(): Promise<BaseStats> {
  const res = await fetch('/api/stats', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
  const json = (await res.json()) as BaseStats;
  return json;
}

export function useAppStats(): AppStats {
  const [stats, setStats] = useState<AppStats>({
    totalLessons: 0,
    totalQuizzes: 0,
    totalModules: 0,
    totalQuestions: 0,
    averageCompletionTime: 0,
    difficultyBreakdown: { beginner: 0, intermediate: 0, advanced: 0 },
    moduleBreakdown: [],
    tierBreakdown: { foundational: 0, core: 0, specialized: 0, quality: 0 },
    topicDistribution: {},
    isLoading: true,
    error: null,
  });

  const load = useCallback(async () => {
    try {
      setStats((prev) => ({ ...prev, isLoading: true, error: null }));
      const data = await fetchStats();
      setStats({ ...data, isLoading: false, error: null });
    } catch (err) {
      setStats((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load stats',
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return stats;
}
