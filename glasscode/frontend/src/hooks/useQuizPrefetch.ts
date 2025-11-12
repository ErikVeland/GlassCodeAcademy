"use client";

import { useEffect, useCallback } from "react";

interface PrefetchOptions {
  enabled?: boolean;
  priorityOrder?: "tier" | "popularity" | "alphabetical";
  maxConcurrent?: number;
  delayBetweenRequests?: number;
}

/**
 * Hook to prefetch quizzes in the background to improve loading performance
 */
export function useQuizPrefetch(options: PrefetchOptions = {}) {
  const {
    enabled = true,
    priorityOrder = "tier",
    maxConcurrent = 3,
    delayBetweenRequests = 1000,
  } = options;

  const getModulesByTierPriority = useCallback(async () => {
    try {
      const res = await fetch("/api/content/registry", { cache: "no-store" });
      if (!res.ok) return [];
      const data = await res.json();
      const modules: Array<{
        slug?: string;
        title?: string;
        order?: number;
        tier?: string;
      }> = Array.isArray(data?.modules) ? data.modules : [];

      const tierOrder = ["foundational", "core", "specialized", "quality"];
      return modules
        .filter((m) => typeof m.slug === "string")
        .map((m) => ({
          slug: String(m.slug),
          title: String(m.title || m.slug),
          order: typeof m.order === "number" ? m.order : 0,
          tier: String(m.tier || "core"),
        }))
        .sort((a, b) => {
          const aTierIndex = tierOrder.indexOf(a.tier);
          const bTierIndex = tierOrder.indexOf(b.tier);
          if (aTierIndex !== bTierIndex) return aTierIndex - bTierIndex;
          return (a.order || 0) - (b.order || 0);
        });
    } catch (error) {
      console.error("Error getting modules for prefetch:", error);
      return [];
    }
  }, []);

  const prefetchQuiz = useCallback(async (moduleSlug: string) => {
    try {
      // Resolve shortSlug via registry routes or fallback heuristic
      let shortSlug = moduleSlug;
      try {
        const res = await fetch("/api/content/registry", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const modules: Array<{
            slug?: string;
            routes?: { overview?: string };
          }> = Array.isArray(data?.modules) ? data.modules : [];
          const match = modules.find((m) => (m?.slug || "") === moduleSlug);
          const overview = match?.routes?.overview;
          shortSlug =
            typeof overview === "string" && overview.trim() !== ""
              ? overview.replace(/^\/+/, "").split("/")[0]
              : moduleSlug.includes("-")
                ? moduleSlug.split("-")[0]
                : moduleSlug;
        }
      } catch {}
      const cacheKey = `prefetch_quiz_${shortSlug}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        const { timestamp } = JSON.parse(cached);
        // Reuse cache if less than 5 minutes old
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          console.log(`[QuizPrefetch] Using cached quiz for ${moduleSlug}`);
          return true;
        }
      }

      console.log(`[QuizPrefetch] Fetching quiz for ${moduleSlug}`);

      // Fetch the quiz via API
      const resQuiz = await fetch(`/api/content/quizzes/${shortSlug}`, {
        cache: "no-store",
      });
      const quiz = resQuiz.ok ? await resQuiz.json() : null;

      if (quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0) {
        // Cache the full quiz data
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            timestamp: Date.now(),
            data: quiz,
          }),
        );

        console.log(
          `[QuizPrefetch] Successfully prefetched quiz for ${moduleSlug} (${quiz.questions.length} questions)`,
        );
        return true;
      } else {
        console.log(`[QuizPrefetch] No questions found for ${moduleSlug}`);
        return false;
      }
    } catch (error) {
      console.error(
        `[QuizPrefetch] Error prefetching quiz for ${moduleSlug}:`,
        error,
      );
      return false;
    }
  }, []);

  const prefetchQuizzesByPriority = useCallback(async () => {
    if (!enabled) return;

    try {
      console.log("[QuizPrefetch] Starting quiz prefetch process");

      let modules: Array<{
        slug: string;
        title: string;
        order: number;
        tier: string;
      }> = [];
      if (priorityOrder === "tier") {
        modules = await getModulesByTierPriority();
      } else {
        const res = await fetch("/api/content/registry", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const allModules: Array<{
            slug?: string;
            title?: string;
            order?: number;
            tier?: string;
          }> = Array.isArray(data?.modules) ? data.modules : [];
          modules = allModules
            .filter((m) => typeof m.slug === "string")
            .map((m) => ({
              slug: String(m.slug),
              title: String(m.title || m.slug),
              order: typeof m.order === "number" ? m.order : 0,
              tier: String(m.tier || "core"),
            }))
            .sort((a, b) => a.title.localeCompare(b.title));
        }
      }

      // Limit to first 15 modules to avoid overwhelming
      modules = modules.slice(0, 15);

      console.log(
        `[QuizPrefetch] Will prefetch quizzes for ${modules.length} modules`,
      );

      // Process in batches to avoid overwhelming the server
      for (let i = 0; i < modules.length; i += maxConcurrent) {
        const batch = modules.slice(i, i + maxConcurrent);
        console.log(
          `[QuizPrefetch] Processing batch ${Math.floor(i / maxConcurrent) + 1}: ${batch.map((m) => m.slug).join(", ")}`,
        );

        // Fetch all quizzes in the batch concurrently
        const promises = batch.map((module) =>
          prefetchQuiz(module.slug)
            .then((result) => ({ module: module.slug, success: result }))
            .catch((error) => {
              console.error(
                `[QuizPrefetch] Error in batch for ${module.slug}:`,
                error,
              );
              return { module: module.slug, success: false };
            }),
        );

        await Promise.all(promises);

        // Add delay between batches
        if (i + maxConcurrent < modules.length) {
          console.log(
            `[QuizPrefetch] Waiting ${delayBetweenRequests}ms before next batch`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, delayBetweenRequests),
          );
        }
      }

      console.log("[QuizPrefetch] Completed quiz prefetch process");
    } catch (error) {
      console.error("[QuizPrefetch] Error in prefetch process:", error);
    }
  }, [
    enabled,
    getModulesByTierPriority,
    maxConcurrent,
    delayBetweenRequests,
    prefetchQuiz,
    priorityOrder,
  ]);

  // Start prefetching when the hook is used
  useEffect(() => {
    if (enabled && typeof window !== "undefined") {
      // Add a small delay to avoid blocking initial page load
      const timer = setTimeout(() => {
        prefetchQuizzesByPriority();
      }, 5000); // Start prefetching after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [enabled, prefetchQuizzesByPriority]);

  return { prefetchQuizzesByPriority };
}
