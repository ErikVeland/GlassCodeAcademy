import { redirect } from 'next/navigation';

export default function WebModulePage() {
  // Redirect to canonical module route
  redirect('/modules/web-fundamentals');
}