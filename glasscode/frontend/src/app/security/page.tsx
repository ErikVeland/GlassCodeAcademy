import { redirect } from 'next/navigation';

export default function SecurityPage() {
  // Redirect to canonical module route
  redirect('/modules/security-fundamentals');
}