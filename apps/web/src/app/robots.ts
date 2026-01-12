import type { MetadataRoute } from "next";
import { getPublicOriginStrict } from "@/lib/urlUtils";

export const revalidate = 3600;

function resolveBaseUrl(): string {
  try {
    return getPublicOriginStrict().replace(/\/+$/, "");
  } catch {
    const port = (process.env.PORT || process.env.NEXT_PUBLIC_PORT || "3000")
      .toString()
      .trim();
    return `http://localhost:${port}`;
  }
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = resolveBaseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/_next/", "/debug/", "/test/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
