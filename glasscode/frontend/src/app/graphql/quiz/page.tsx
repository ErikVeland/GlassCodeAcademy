import { redirect } from 'next/navigation';

export default function GraphQLQuizPage() {
  // Redirect to canonical module route
  redirect('/modules/graphql-fundamentals/quiz');
}