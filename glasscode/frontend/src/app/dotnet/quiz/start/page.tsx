import { redirect } from 'next/navigation';

export default function DotnetQuizStartPage() {
  // Redirect to canonical module route
  redirect('/modules/dotnet/quiz/start');
}
