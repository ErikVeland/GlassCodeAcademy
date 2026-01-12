import Link from "next/link";
import { getApiBaseStrict } from "@/lib/urlUtils";

type ThreadAuthor = { id: number; name: string; email?: string };
type Thread = {
  id: number;
  title: string;
  slug?: string;
  content?: string;
  isPinned?: boolean;
  isLocked?: boolean;
  replyCount?: number;
  lastReplyAt?: string;
  author?: ThreadAuthor;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export const dynamic = "force-dynamic";

async function fetchThreads(
  categoryId: string,
): Promise<{ threads: Thread[]; pagination?: Pagination }> {
  const apiBase = (() => {
    try {
      return getApiBaseStrict();
    } catch {
  return "http://127.0.0.1:8081";
    }
  })();
  const url = `${apiBase}/api/forum/categories/${categoryId}/threads?page=1&limit=20`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return { threads: [] };
  const json = (await res.json()) as {
    success: boolean;
    data: Thread[];
    pagination?: Pagination;
  };
  const threads = Array.isArray(json?.data) ? json.data : [];
  return { threads, pagination: json?.pagination };
}

export default async function CategoryThreadsPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const { threads } = await fetchThreads(categoryId);

  return (
    <div className="liquid-glass-layout min-h-screen bg-bg">
      <div className="liquid-glass-content mx-auto py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-fg">📂 Threads</h1>
          <Link
            href="/forum"
            className="text-sm px-3 py-2 bg-surface-alt border border-border rounded-md hover:opacity-90"
          >
            ← Back to Categories
          </Link>
        </div>

        <div className="space-y-3">
          {threads.length === 0 && (
            <div className="glass-card p-6 text-center">
              <p className="text-muted">No threads in this category yet.</p>
            </div>
          )}

          {threads.map((t) => (
            <Link key={t.id} href={`/forum/thread/${t.id}`} className="block">
              <div className="glass-card p-6 hover:opacity-95 transition">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-fg">{t.title}</h2>
                  <div className="flex items-center gap-2">
                    {t.isPinned && (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-400/30">
                        Pinned
                      </span>
                    )}
                    {t.isLocked && (
                      <span className="text-xs px-2 py-1 rounded-full bg-danger/20 text-danger border border-danger/30">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-sm text-muted">
                  <span>Replies: {t.replyCount ?? 0}</span>
                  {t.lastReplyAt && (
                    <span className="ml-3">
                      Last reply: {new Date(t.lastReplyAt).toLocaleString()}
                    </span>
                  )}
                  {t.author?.name && (
                    <span className="ml-3">By {t.author.name}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
