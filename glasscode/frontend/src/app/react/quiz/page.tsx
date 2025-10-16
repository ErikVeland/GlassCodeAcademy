import { redirect } from 'next/navigation';

export default function ReactQuizPage() {
  // Redirect to canonical module route
  redirect('/modules/react-fundamentals/quiz');
}