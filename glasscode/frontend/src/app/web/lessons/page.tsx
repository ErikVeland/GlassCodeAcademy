import { redirect } from 'next/navigation';

export default function WebLessonsPage() {
  // Redirect to canonical module lessons route
  redirect('/modules/web-fundamentals/lessons');
}