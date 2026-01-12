"use client";

import React, { useEffect, useState } from "react";

type EndpointStatus = {
  url: string;
  ok: boolean;
  status: number | null;
  latencyMs: number | null;
  error?: string;
};

const DEBUG =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEBUG === "true";

async function checkEndpoint(
  url: string,
  timeoutMs = 4000,
): Promise<EndpointStatus> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });
    const latencyMs = Date.now() - start;
    clearTimeout(timeout);
    return { url, ok: res.ok, status: res.status, latencyMs };
  } catch (err: unknown) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : String(err);
    return { url, ok: false, status: null, latencyMs: null, error: message };
  }
}

export default function StatusBanner() {
  const [health, setHealth] = useState<EndpointStatus | null>(null);
  const [registry, setRegistry] = useState<EndpointStatus | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [h, r] = await Promise.all([
        checkEndpoint("/health"),
        checkEndpoint("/api/content/registry"),
      ]);
      if (!mounted) return;
      setHealth(h);
      setRegistry(r);
      const hasIssue =
        !h.ok ||
        !r.ok ||
        (h.latencyMs ?? 0) > 1500 ||
        (r.latencyMs ?? 0) > 1500;
      setVisible(hasIssue || DEBUG);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!visible) return null;

  const items: EndpointStatus[] = [health, registry].filter(
    Boolean,
  ) as EndpointStatus[];
  const anyError = items.some((i) => !i.ok);

  return (
    <div
      className={`w-full z-50 ${anyError ? "bg-red-600" : "bg-amber-500"} text-white`}
      role="status"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="font-medium">
            {anyError ? "Connectivity issues detected" : "Connectivity check"}
          </div>
          <div className="flex flex-wrap gap-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-black/20">
                  {item.url}
                </span>
                <span
                  className={`px-2 py-0.5 rounded ${item.ok ? "bg-green-700" : "bg-red-700"}`}
                >
                  {item.ok ? `OK ${item.status}` : `ERR ${item.status ?? ""}`}
                </span>
                <span className="px-2 py-0.5 rounded bg-black/20">
                  {item.latencyMs != null ? `${item.latencyMs}ms` : "n/a"}
                </span>
                {item.error && (
                  <span
                    className="px-2 py-0.5 rounded bg-black/20 max-w-[30ch] truncate"
                    title={item.error}
                  >
                    {item.error}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
