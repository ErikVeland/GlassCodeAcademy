import { redirect } from 'next/navigation';

export default function PerformancePage() {
  // Redirect to canonical module route
  redirect('/modules/performance-fundamentals');
}