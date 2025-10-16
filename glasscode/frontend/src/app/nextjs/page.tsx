import { redirect } from 'next/navigation';

export default function NextJSPage() {
  // Redirect to canonical module route
  redirect('/modules/nextjs-fundamentals');
}