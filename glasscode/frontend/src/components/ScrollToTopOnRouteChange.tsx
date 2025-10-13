"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToTopOnRouteChange() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Only trigger when path changes
    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;
      // Defer to next tick to ensure content is rendered
      setTimeout(() => {
        try {
          const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (prefersReduced) {
            window.scrollTo(0, 0);
          } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        } catch {
          // Fallback if smooth isn't supported
          window.scrollTo(0, 0);
        }
      }, 0);
    }
  }, [pathname]);

  return null;
}