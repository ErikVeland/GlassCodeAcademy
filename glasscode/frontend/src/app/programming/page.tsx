import { redirect } from 'next/navigation';

export default function ProgrammingOverviewPage() {
  // Redirect to canonical module route
  redirect('/modules/programming-fundamentals');
}