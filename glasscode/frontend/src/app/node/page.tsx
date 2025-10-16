import { redirect } from 'next/navigation';

export default function NodePage() {
  // Redirect to canonical module route
  redirect('/modules/node-fundamentals');
}