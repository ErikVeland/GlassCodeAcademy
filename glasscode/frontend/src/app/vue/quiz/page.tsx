import { redirect } from 'next/navigation';

export default function VueQuizPage() {
  // Redirect to canonical module route
  redirect('/modules/vue-fundamentals/quiz');
}