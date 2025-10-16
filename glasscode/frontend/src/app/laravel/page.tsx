import { redirect } from 'next/navigation';

export default function LaravelPage() {
  // Redirect to canonical module route
  redirect('/modules/laravel-fundamentals');
}