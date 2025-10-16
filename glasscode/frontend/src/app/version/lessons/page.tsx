import { redirect } from 'next/navigation';

export default function VersionLessonsPage() {
  // Redirect to canonical module lessons route
  redirect('/modules/version-control/lessons');
}