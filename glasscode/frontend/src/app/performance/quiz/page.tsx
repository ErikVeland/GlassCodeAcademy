import { redirect } from 'next/navigation';

export default function PerformanceQuizPage() {
  // Redirect to canonical module route
  redirect('/modules/performance-fundamentals/quiz');
}