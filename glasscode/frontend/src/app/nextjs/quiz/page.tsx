import { redirect } from 'next/navigation';

export default function NextJSQuizPage() {
  // Redirect to canonical module route
  redirect('/modules/nextjs-fundamentals/quiz');
}