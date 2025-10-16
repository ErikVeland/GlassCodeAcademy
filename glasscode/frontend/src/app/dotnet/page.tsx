import { redirect } from 'next/navigation';

export default function DotNetPage() {
  // Redirect to canonical module route
  redirect('/modules/dotnet-fundamentals');
}