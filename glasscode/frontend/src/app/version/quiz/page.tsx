import { redirect } from 'next/navigation';

export default function VersionQuizPage() {
  // Redirect to canonical module quiz route
  redirect('/modules/version-control/quiz');
}