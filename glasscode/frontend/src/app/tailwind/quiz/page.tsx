import { redirect } from 'next/navigation';

export default function TailwindQuizPage() {
  // Redirect to canonical module route
  redirect('/modules/tailwind-fundamentals/quiz');
}