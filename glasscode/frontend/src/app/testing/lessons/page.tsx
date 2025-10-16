import { redirect } from 'next/navigation';

export default function TestingLessonsPage() {
  // Redirect to canonical module route
  redirect('/modules/testing-fundamentals/lessons');
}