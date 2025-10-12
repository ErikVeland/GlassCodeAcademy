import { redirect } from 'next/navigation';

export default function ProgrammingInterviewStart() {
  // Redirect to the main interview page which contains the quiz
  redirect('/programming/interview');
}