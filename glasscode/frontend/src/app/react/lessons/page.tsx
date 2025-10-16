import { redirect } from 'next/navigation';

export default function ReactLessonsPage() {
  // Redirect to canonical module route
  redirect('/modules/react-fundamentals/lessons');
}