import { redirect } from 'next/navigation';

export default function TypeScriptQuizPage() {
  // Redirect to canonical module route
  redirect('/modules/typescript-fundamentals/quiz');
}