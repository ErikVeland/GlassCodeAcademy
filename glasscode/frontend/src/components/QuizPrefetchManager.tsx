"use client";

import { useEffect } from "react";
import { useQuizPrefetch } from "@/hooks/useQuizPrefetch";
import { quizPrefetchService } from "@/lib/quizPrefetchService";

/**
 * Component to manage quiz prefetching
 * This component should be included in the root layout to start prefetching
 * when users visit the site
 */
export default function QuizPrefetchManager() {
  // Use the hook for component-level prefetching
  const { prefetchQuizzesByPriority } = useQuizPrefetch({
    enabled: true,
    priorityOrder: "tier",
    maxConcurrent: 3,
    delayBetweenRequests: 1000,
  });

  useEffect(() => {
    // Start prefetching when the component mounts
    if (typeof window !== "undefined") {
      console.log("[QuizPrefetchManager] Initializing quiz prefetching");

      // Start the service worker prefetching
      setTimeout(() => {
        quizPrefetchService.startPrefetching("tier");
      }, 5000); // Start after 5 seconds

      // Also trigger the hook-based prefetching
      setTimeout(() => {
        prefetchQuizzesByPriority();
      }, 10000); // Start after 10 seconds
    }
  }, [prefetchQuizzesByPriority]);

  // This component doesn't render anything visible
  return null;
}
