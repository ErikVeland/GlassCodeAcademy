import { redirect } from 'next/navigation';

export default function ProgrammingQuizPage() {
  // Redirect to canonical module quiz route
  redirect('/modules/programming-fundamentals/quiz');
}