import { redirect } from 'next/navigation';

export default function ReactPage() {
  // Redirect to canonical module route
  redirect('/modules/react-fundamentals');
}