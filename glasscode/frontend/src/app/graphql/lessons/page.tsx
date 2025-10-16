import { redirect } from 'next/navigation';

export default function GraphQLLessonsPage() {
  // Redirect to canonical module route
  redirect('/modules/graphql-fundamentals/lessons');
}