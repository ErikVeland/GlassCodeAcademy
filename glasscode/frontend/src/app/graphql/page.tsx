import { redirect } from 'next/navigation';

export default function GraphQLPage() {
  // Redirect to canonical module route
  redirect('/modules/graphql-fundamentals');
}