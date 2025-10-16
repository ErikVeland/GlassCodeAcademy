import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('react-fundamentals');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `${currentModule.title} Quiz - Fullstack Learning Platform`,
    description: `Test your knowledge of ${currentModule.title} with comprehensive questions and scenarios. ${currentModule.description}`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function ReactQuizPage() {
  let currentModule = null;
  let quiz = null;

  try {
    currentModule = await contentRegistry.getModule('react-fundamentals');
    if (!currentModule) {
      redirect('/');
      return;
    }

    quiz = await contentRegistry.getModuleQuiz(currentModule.slug);
    
    // Check if module meets minimum requirements
    const hasMinimumLessons = !currentModule.thresholds?.requiredLessons || 
      (await contentRegistry.getModuleLessons(currentModule.slug)).length >= currentModule.thresholds.requiredLessons;
    
    const hasMinimumQuestions = !currentModule.thresholds?.requiredQuestions || 
      (quiz?.questions?.length || 0) >= currentModule.thresholds.requiredQuestions;

    if (!hasMinimumLessons || !hasMinimumQuestions) {
      redirect('/react');
      return;
    }

    redirect('/react/quiz/start');
  } catch (error) {
    console.error('Error loading quiz data:', error);
    redirect('/react');
  }
}