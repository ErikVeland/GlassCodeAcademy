import Link from "next/link";
import { getApiBaseStrict } from "@/lib/urlUtils";

type ForumCategory = {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
};

export const dynamic = "force-dynamic";

async function fetchCategories(): Promise<ForumCategory[]> {
  // Try to resolve API base; fall back in dev to typical backend port
  const apiBase = (() => {
    try {
      return getApiBaseStrict();
    } catch {
      return "http://127.0.0.1:8080";
    }
  })();
  const res = await fetch(`${apiBase}/api/forum/categories`, {
    cache: "no-store",
  });
  if (!res.ok) {
    // Return empty list on failure so page still renders
    return [];
  }
  const json = await res.json();
  // Controllers return { success, data }
  return Array.isArray(json?.data) ? json.data : [];
}

export default async function ForumPage() {
  const categories = await fetchCategories();

  return (
    <div className="liquid-glass-layout min-h-screen bg-bg">
      <div className="liquid-glass-content mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-fg mb-3">
            💬 Forum & Community
          </h1>
          <p className="text-muted max-w-2xl mx-auto">
            Discuss lessons, ask questions, and share insights with the
            community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3">
              <div className="glass-card p-6 text-center">
                <p className="text-muted">
                  No categories available yet. Check back soon.
                </p>
              </div>
            </div>
          )}

          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/forum/category/${cat.id}`}
              className="glass-card p-6 block hover:opacity-95 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-fg">{cat.name}</h2>
                <span className="text-xs px-2 py-1 rounded-full bg-primary text-primary-fg">
                  Category
                </span>
              </div>
              {cat.description && (
                <p className="text-muted text-sm">{cat.description}</p>
              )}
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-fg rounded-lg hover:opacity-90 transition-colors"
          >
            🏠 Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
