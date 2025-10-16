import { redirect } from 'next/navigation';

export default function TailwindLessonsPage() {
  // Redirect to canonical module route
  redirect('/modules/tailwind-fundamentals/lessons');
}