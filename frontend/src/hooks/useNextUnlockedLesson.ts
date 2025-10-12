import { useEffect, useState } from 'react';
import { contentRegistry } from '@/lib/contentRegistry';
import { useProgressTracking } from '@/hooks/useProgressTracking';

// Computes the next unlocked lesson URL based on current module completion and prerequisites
export const useNextUnlockedLesson = () => {
  const { progress } = useProgressTracking();
  const [nextLessonHref, setNextLessonHref] = useState<string | null>(null);

  useEffect(() => {
    const compute = async () => {
      try {
        // Get tiers ordered by level
        const tiers = await contentRegistry.getTiers();
        const tierOrder = Object.keys(tiers).sort((a, b) =>
          (tiers[a].level ?? 0) - (tiers[b].level ?? 0)
        );

        // Iterate tiers then modules to find first unlocked, not-completed module
        for (const tierKey of tierOrder) {
          const modules = await contentRegistry.getModulesByTier(tierKey);
          for (const mod of modules) {
            const prereqsMet = (mod.prerequisites || []).every(p =>
              progress[p]?.completionStatus === 'completed'
            );
            const status = progress[mod.slug]?.completionStatus || 'not-started';
            if (prereqsMet && status !== 'completed') {
              // Determine first lesson order from lesson groups
              const groups = await contentRegistry.getLessonGroups(mod.slug);
              let firstLessonOrder = 1;
              if (groups && groups.length > 0 && groups[0].lessons && groups[0].lessons.length > 0) {
                firstLessonOrder = groups[0].lessons[0].order;
              }
              setNextLessonHref(`${mod.routes.lessons}/${firstLessonOrder}`);
              return;
            }
          }
        }

        // Fallback: find next module by tier order, ignore prerequisites
        for (const tierKey of tierOrder) {
          const modules = await contentRegistry.getModulesByTier(tierKey);
          for (const mod of modules) {
            const status = progress[mod.slug]?.completionStatus || 'not-started';
            if (status !== 'completed') {
              const groups = await contentRegistry.getLessonGroups(mod.slug);
              let firstLessonOrder = 1;
              if (groups && groups.length > 0 && groups[0].lessons && groups[0].lessons.length > 0) {
                firstLessonOrder = groups[0].lessons[0].order;
              }
              setNextLessonHref(`${mod.routes.lessons}/${firstLessonOrder}`);
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