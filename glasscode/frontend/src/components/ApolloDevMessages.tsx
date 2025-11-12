"use client";

import { useEffect } from "react";

export default function ApolloDevMessages() {
  useEffect(() => {
    const enabled = process.env.NEXT_PUBLIC_ENABLE_APOLLO_DEV === "true";
    if (enabled && process.env.NODE_ENV !== "production") {
      (async () => {
        try {
          type ApolloDevModule = {
            loadDevMessages?: () => void;
            loadErrorMessages?: () => void;
          };
          const mod = (await import("@apollo/client/dev")) as ApolloDevModule;
          const { loadDevMessages, loadErrorMessages } = mod;
          try {
            loadDevMessages?.();
            loadErrorMessages?.();
          } catch {
            // Swallow errors from dev helpers to avoid impacting runtime
          }
        } catch {
          // Ignore module load failures in non-production environments
        }
      })();
    }
  }, []);
  return null;
}
