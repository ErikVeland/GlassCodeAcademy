"use client";

import { useRouter } from "next/navigation";

export default function RetryButton() {
  const router = useRouter();
  return (
    <button
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      onClick={() => router.refresh()}
    >
      Try Again
    </button>
  );
}
