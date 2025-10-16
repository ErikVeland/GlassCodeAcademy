import { redirect } from 'next/navigation';

export default function VueLessonsPage() {
  // Redirect to canonical module route
  redirect('/modules/vue-fundamentals/lessons');
}