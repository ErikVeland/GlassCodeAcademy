import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <h2 className="text-3xl font-bold mb-4">Not Found</h2>
      <p className="mb-8 text-gray-600">Could not find requested resource</p>
      <Link 
        href="/"
        className="text-primary hover:underline"
      >
        Return Home
      </Link>
    </div>
  );
}
