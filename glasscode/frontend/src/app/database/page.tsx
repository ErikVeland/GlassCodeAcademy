import { redirect } from 'next/navigation';

export default function DatabasePage() {
  // Redirect to canonical module route
  redirect('/modules/database-fundamentals');
}