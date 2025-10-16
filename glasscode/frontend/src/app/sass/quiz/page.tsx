import { redirect } from 'next/navigation';

export default function SassQuizPage() {
  // Redirect to canonical module route
  redirect('/modules/sass-fundamentals/quiz');
}