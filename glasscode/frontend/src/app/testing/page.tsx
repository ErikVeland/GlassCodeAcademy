import { redirect } from 'next/navigation';

export default function TestingPage() {
  // Redirect to canonical module route
  redirect('/modules/testing-fundamentals');
}