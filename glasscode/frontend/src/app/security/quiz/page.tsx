import { redirect } from 'next/navigation';

export default function SecurityQuizPage() {
  // Redirect to canonical module route
  redirect('/modules/security-fundamentals/quiz');
}