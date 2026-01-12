import Link from "next/link";
import { getApiBaseStrict } from "@/lib/urlUtils";

type User = { id: number; name: string; email?: string };
type Category = { id: number; name: string; slug?: string };
type Post = {
  id: number;
  content: string;
  author?: User;
  created_at?: string;
  createdAt?: string;
  replies?: Post[];
};
type Thread = {
  id: number;
  title: string;
  content?: string;
  author?: User;
  category?: Category;
};

export const dynamic = "force-dynamic";

async function fetchThread(
  threadId: string,
): Promise<{ thread: Thread | null; posts: Post[] }> {
  const apiBase = (() => {
    try {
      return getApiBaseStrict();
    } catch {
  return "http://127.0.0.1:8081";
    }
  })();
  const res = await fetch(
    `${apiBase}/api/forum/threads/${threadId}?page=1&limit=20`,
    { cache: "no-store" },
  );
  if (!res.ok) return { thread: null, posts: [] };
  const json = await res.json();
  const thread = json?.data?.thread ?? null;
  const posts = Array.isArray(json?.data?.posts) ? json.data.posts : [];
  return { thread, posts };
}

function PostItem({ post, depth = 0 }: { post: Post; depth?: number }) {
  const ts = post.createdAt || post.created_at;
  return (
    <div className="glass-card p-4 mb-3" style={{ marginLeft: depth * 20 }}>
      <div className="text-sm text-muted mb-2">
        {post.author?.name ? (
          <span>By {post.author.name}</span>
        ) : (
          <span>By Member</span>
        )}
        {ts && <span className="ml-3">{new Date(ts).toLocaleString()}</span>}
      </div>
      <div className="text-fg whitespace-pre-wrap">{post.content}</div>
      {Array.isArray(post.replies) && post.replies.length > 0 && (
        <div className="mt-3">
          {post.replies.map((r) => (
            <PostItem key={r.id} post={r} depth={(depth || 0) + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const { thread, posts } = await fetchThread(threadId);

  if (!thread) {
    return (
      <div className="liquid-glass-layout min-h-screen bg-bg">
        <div className="liquid-glass-content mx-auto py-8">
          <div className="glass-card p-6 text-center">
            <p className="text-muted">Thread not found.</p>
            <div className="mt-4 flex gap-3 justify-center">
              <Link
                href="/forum"
                className="px-4 py-2 bg-primary text-primary-fg rounded-lg"
              >
                Back to Forum
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="liquid-glass-layout min-h-screen bg-bg">
      <div className="liquid-glass-content mx-auto py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-fg">🧵 {thread.title}</h1>
            {thread.category?.name && (
              <p className="text-muted">Category: {thread.category.name}</p>
            )}
          </div>
          <Link
            href={`/forum/category/${thread.category?.id ?? ""}`}
            className="text-sm px-3 py-2 bg-surface-alt border border-border rounded-md hover:opacity-90"
          >
            ← Back to Threads
          </Link>
        </div>

        {thread.content && (
          <div className="glass-card p-6 mb-6">
            <div className="text-fg whitespace-pre-wrap">{thread.content}</div>
          </div>
        )}

        <h2 className="text-xl font-semibold text-fg mb-3">Replies</h2>
        {posts.length === 0 ? (
          <div className="glass-card p-6 text-center">
            <p className="text-muted">
              No replies yet. Be the first to respond!
            </p>
          </div>
        ) : (
          <div>
            {posts.map((p) => (
              <PostItem key={p.id} post={p} />
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            href="/forum"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-fg rounded-lg hover:opacity-90 transition-colors"
          >
            💬 Back to Forum
          </Link>
        </div>
      </div>
    </div>
  );
}
