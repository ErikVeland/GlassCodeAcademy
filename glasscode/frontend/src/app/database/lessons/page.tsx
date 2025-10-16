import { redirect } from 'next/navigation';

export default function DatabaseLessonsPage() {
  // Redirect to canonical module route
  redirect('/modules/database-fundamentals/lessons');
}