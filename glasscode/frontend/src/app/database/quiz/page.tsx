import { redirect } from 'next/navigation';

export default function DatabaseQuizPage() {
  // Redirect to canonical module route
  redirect('/modules/database-fundamentals/quiz');
}