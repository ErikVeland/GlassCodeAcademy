import { redirect } from 'next/navigation';

export default function VuePage() {
  // Redirect to canonical module route
  redirect('/modules/vue-fundamentals');
}