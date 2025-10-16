import { redirect } from 'next/navigation';

export default function ProgrammingLessonsPage() {
  // Redirect to canonical module lessons route
  redirect('/modules/programming-fundamentals/lessons');
}