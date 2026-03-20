'use client';

export default function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="glass-card text-fg">{message}</div>
    </div>
  );
}
