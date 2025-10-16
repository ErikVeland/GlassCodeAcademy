import { redirect } from 'next/navigation';

export default function LaravelLessonsPage() {
  // Redirect to canonical module route
  redirect('/modules/laravel-fundamentals/lessons');
}