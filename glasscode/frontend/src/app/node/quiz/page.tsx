import { redirect } from 'next/navigation';

export default function NodeQuizPage() {
  // Redirect to canonical module route
  redirect('/modules/node-fundamentals/quiz');
}