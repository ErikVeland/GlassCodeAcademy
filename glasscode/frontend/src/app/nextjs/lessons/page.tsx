import { redirect } from 'next/navigation';

export default function NextJSLessonsPage() {
  // Redirect to canonical module route
  redirect('/modules/nextjs-fundamentals/lessons');
}