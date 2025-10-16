import { redirect } from 'next/navigation';

export default function PerformanceLessonsPage() {
  // Redirect to canonical module route
  redirect('/modules/performance-fundamentals/lessons');
}