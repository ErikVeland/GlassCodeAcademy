"use client";

import { useEffect } from "react";

export default function ApolloDevMessages() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      import("@apollo/client/dev")
        .then(({ loadDevMessages, loadErrorMessages }) => {
          try {
            loadDevMessages();
            loadErrorMessages();
          } catch {
            // Swallow errors from dev helpers to avoid impacting runtime
          }
        })
        .catch(() => {
          // Ignore module load failures in non-production environments
        });
    }
  }, []);
  return null;
}