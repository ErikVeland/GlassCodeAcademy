import { redirect } from 'next/navigation';

export default function DotNetLessonsPage() {
  // Redirect to canonical module route
  redirect('/modules/dotnet-fundamentals/lessons');
}