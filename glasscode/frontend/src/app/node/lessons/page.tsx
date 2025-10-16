import { redirect } from 'next/navigation';

export default function NodeLessonsPage() {
  // Redirect to canonical module route
  redirect('/modules/node-fundamentals/lessons');
}