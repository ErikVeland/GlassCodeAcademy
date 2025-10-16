import { redirect } from 'next/navigation';

export default function TailwindPage() {
  // Redirect to canonical module route
  redirect('/modules/tailwind-fundamentals');
}