import { redirect } from 'next/navigation';

export default function InterviewRedirect() {
  redirect('/modules/version-control/quiz');
}