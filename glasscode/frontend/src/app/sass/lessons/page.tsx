import { redirect } from 'next/navigation';

export default function SassLessonsPage() {
  // Redirect to canonical module route
  redirect('/modules/sass-fundamentals/lessons');
}