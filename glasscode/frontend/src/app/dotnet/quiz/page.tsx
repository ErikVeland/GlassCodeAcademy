import { redirect } from 'next/navigation';

export default function DotNetQuizPage() {
  // Redirect to canonical module route
  redirect('/modules/dotnet-fundamentals/quiz');
}