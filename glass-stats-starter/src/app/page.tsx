import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-2xl border border-border bg-surface-alt p-6">
        <h1 className="text-2xl font-bold text-fg">GlassStats Starter</h1>
        <p className="text-muted mt-2">
          A standalone example dashboard for showcasing dev progress.
        </p>
        <div className="mt-6">
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-primary-fg hover:opacity-90 transition-opacity"
            href="/stats"
          >
            Open Stats
          </Link>
        </div>
      </div>
    </main>
  );
}
