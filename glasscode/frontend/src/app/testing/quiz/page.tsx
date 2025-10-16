import { redirect } from 'next/navigation';

export default function TestingQuizPage() {
  // Redirect to canonical module route
  redirect('/modules/testing-fundamentals/quiz');
}