import { useEffect, useState } from 'react';
import { useProgressTracking } from '@/hooks/useProgressTracking';

interface RegistryModule {
  slug: string;
  prerequisites?: string[];
  tier?: string;
  routes: {
    lessons: string;
  };
}

interface RegistryResponse {
  modules: RegistryModule[];
  tiers: Record<string, { level?: number }>;
}

const fetchJSON = async <T>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as T;
};

// Computes the next unlocked lesson URL based on current module completion and prerequisites
export const useNextUnlockedLesson = () => {
  const { progress } = useProgressTracking();
  const [nextLessonHref, setNextLessonHref] = useState<string | null>(null);

  useEffect(() => {
    const compute = async () => {
      try {
        // Load registry and compute tier order
        const registry = await fetchJSON<RegistryResponse>('/api/content/registry');
        const tiers = registry.tiers || {};
        let tierOrder = Object.keys(tiers).sort((a, b) =>
          (tiers[a]?.level ?? 0) - (tiers[b]?.level ?? 0)
        );
        if (tierOrder.length === 0) {
          tierOrder = ['foundational', 'core', 'specialized', 'quality'];
        }

        // Iterate tiers then modules to find first unlocked, not-completed module
        for (const tierKey of tierOrder) {
          const modules = registry.modules.filter((m) => m.tier === tierKey);
          for (const mod of modules) {
            const prereqsMet = (mod.prerequisites || []).every(p =>
              progress[p]?.completionStatus === 'completed'
            );
            const status = progress[mod.slug]?.completionStatus || 'not-started';
            if (prereqsMet && status !== 'completed') {
              // Determine first lesson index by fetching lessons and selecting index 0
              let firstLessonIndex = 0;
              try {
                const lessons = await fetchJSON<unknown[]>(`/api/content/lessons/${mod.slug}`);
                if (Array.isArray(lessons) && lessons.length > 0) {
                  firstLessonIndex = 0;
                }
              } catch {
                firstLessonIndex = 0;
              }
              {
                const lessonsPath = mod.routes.lessons;
                const shouldAppendOrder = lessonsPath.startsWith('/modules/');
                const href = shouldAppendOrder ? `${lessonsPath}/${firstLessonIndex + 1}` : lessonsPath;
                setNextLessonHref(href);
              }
              return;
            }
          }
        }

        // Fallback: find next module by tier order, ignore prerequisites
        for (const tierKey of tierOrder) {
          const modules = registry.modules.filter((m) => m.tier === tierKey);
          for (const mod of modules) {
            const status = progress[mod.slug]?.completionStatus || 'not-started';
            if (status !== 'completed') {
              let firstLessonIndex = 0;
              try {
                const lessons = await fetchJSON<unknown[]>(`/api/content/lessons/${mod.slug}`);
                if (Array.isArray(lessons) && lessons.length > 0) {
                  firstLessonIndex = 0;
                }
              } catch {
                firstLessonIndex = 0;
              }
              {
                const lessonsPath = mod.routes.lessons;
                const shouldAppendOrder = lessonsPath.startsWith('/modules/');
                const href = shouldAppendOrder ? `${lessonsPath}/${firstLessonIndex + 1}` : lessonsPath;
                setNextLessonHref(href);
              }
              return;
            }
          }
        }

        // If everything completed, return null
        setNextLessonHref(null);
      } catch (e) {
        console.error('Failed to compute next unlocked lesson', e);
        setNextLessonHref(null);
      }
    };

    compute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(progress)]);

  return { nextLessonHref };
};