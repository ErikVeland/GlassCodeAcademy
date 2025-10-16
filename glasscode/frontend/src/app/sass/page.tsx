import { redirect } from 'next/navigation';

export default function SassPage() {
  // Redirect to canonical module route
  redirect('/modules/sass-fundamentals');
}