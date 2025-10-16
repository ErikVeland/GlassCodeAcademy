import { redirect } from 'next/navigation';

export default function VersionModulePage() {
  // Redirect to canonical module route
  redirect('/modules/version-control');
}