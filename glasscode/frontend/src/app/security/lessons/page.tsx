import { redirect } from 'next/navigation';

export default function SecurityLessonsPage() {
  // Redirect to canonical module route
  redirect('/modules/security-fundamentals/lessons');
}