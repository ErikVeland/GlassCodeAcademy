import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="glass-morphism p-8 rounded-xl text-center">
        <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
        <p className="text-muted mb-6">
          The page you are looking for does not exist or may have moved.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-primary text-primary-fg rounded-lg hover:opacity-90 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}