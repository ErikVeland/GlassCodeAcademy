import { redirect } from 'next/navigation';

export default function LaravelQuizPage() {
  // Redirect to canonical module route
  redirect('/modules/laravel-fundamentals/quiz');
}