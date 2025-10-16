import { notFound } from 'next/navigation';
import Link from 'next/link';
import { contentRegistry, getLessonGroupForLesson, getNextLessonGroup } from '@/lib/contentRegistry';
import { Metadata } from 'next';

interface LessonPageProps {
  params: Promise<{ 
    lessonOrder: string;
  }>;
}

// Explicit interfaces to avoid 'any' types in maps
interface Pitfall {
  mistake?: string;
  solution?: string;
  severity?: 'high' | 'medium' | 'low';
}

interface Exercise {
  title?: string;
  description?: string;
  checkpoints?: string[];
}

export async function generateStaticParams() {
  try {
    // Find the programming-fundamentals module
    const mod = await contentRegistry.findModuleByRoutePath('/programming/lessons');
    if (!mod) return [];
    
    const lessons = await contentRegistry.getModuleLessons(mod.slug);
    if (!lessons) return [];
    
    // Only generate first 3 lessons statically
    const lessonsToGenerate = Math.min(3, lessons.length);
    const params: Array<{ lessonOrder: string }> = [];
    
    for (let i = 0; i < lessonsToGenerate; i++) {
      params.push({
        lessonOrder: (i + 1).toString(),
      });
    }
    
    return params;
  } catch (error) {
    console.warn('Failed to generate static params for programming lessons:', error);
    return [];
  }
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { lessonOrder } = await params;
  const mod = await contentRegistry.findModuleByRoutePath('/programming/lessons');
  
  if (!mod) {
    return { title: 'Lesson Not Found' };
  }
  
  const lessons = await contentRegistry.getModuleLessons(mod.slug);
  const lessonIndex = parseInt(lessonOrder) - 1;
  const lesson = lessons?.[lessonIndex];
  
  return {
    title: lesson ? `${lesson.title} - ${mod.title} Lessons` : `Lesson ${lessonOrder} - ${mod.title}`,
    description: lesson?.intro?.substring(0, 160) || `Learn ${mod.title} fundamentals`,
  };
}

export const revalidate = 3600; // Revalidate every hour
export const dynamicParams = true; // Allow dynamic params not in generateStaticParams

export default async function LessonPage({ params }: LessonPageProps) {
  const { lessonOrder } = await params;
  const lessonOrderNum = parseInt(lessonOrder);
  
  // Find the programming-fundamentals module
  const currentModule = await contentRegistry.findModuleByRoutePath('/programming/lessons');
  
  if (!currentModule) {
    notFound();
  }

  const lessons = await contentRegistry.getModuleLessons(currentModule.slug);
  const lessonIndex = lessonOrderNum - 1;
  const lesson = lessons?.[lessonIndex];
  
  if (!lesson || !lessons) {
    notFound();
  }

  const nextLesson = lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;
  const prevLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
            <li className="before:content-['/'] before:mx-2">
              <Link href="/programming" className="hover:text-blue-600">{currentModule.title}</Link>
            </li>
            <li className="before:content-['/'] before:mx-2">
              <Link href="/programming/lessons" className="hover:text-blue-600">Lessons</Link>
            </li>
            <li className="before:content-['/'] before:mx-2 text-gray-900">{lesson.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-8">
              {/* Lesson Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{currentModule.icon}</span>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
                    <p className="text-gray-600 mt-2">{lesson.description}</p>
                  </div>
                </div>
                
                {lesson.estimatedTime && (
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {lesson.estimatedTime} min
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Lesson {lesson.order}
                    </span>
                  </div>
                )}
              </div>

              {/* Lesson Content */}
              <div className="prose prose-lg max-w-none">
                <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
              </div>

              {/* Code Examples */}
              {lesson.codeExamples && lesson.codeExamples.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Code Examples</h3>
                  <div className="space-y-4">
                    {lesson.codeExamples.map((example, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        {example.title && <h4 className="font-medium mb-2">{example.title}</h4>}
                        {example.description && <p className="text-gray-600 mb-3">{example.description}</p>}
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                          <code>{example.code}</code>
                        </pre>
                        {example.explanation && (
                          <p className="text-gray-600 mt-2 text-sm">{example.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Common Pitfalls */}
              {lesson.commonPitfalls && lesson.commonPitfalls.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Common Pitfalls</h3>
                  <div className="space-y-4">
                    {lesson.commonPitfalls.map((pitfall: Pitfall, index: number) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <div>
                            {pitfall.mistake && <p className="font-medium text-red-800 mb-1">{pitfall.mistake}</p>}
                            {pitfall.solution && <p className="text-red-700">{pitfall.solution}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exercises */}
              {lesson.exercises && lesson.exercises.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Practice Exercises</h3>
                  <div className="space-y-4">
                    {lesson.exercises.map((exercise: Exercise, index: number) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        {exercise.title && <h4 className="font-medium text-blue-900 mb-2">{exercise.title}</h4>}
                        {exercise.description && <p className="text-blue-800 mb-3">{exercise.description}</p>}
                        {exercise.checkpoints && exercise.checkpoints.length > 0 && (
                          <ul className="space-y-1">
                            {exercise.checkpoints.map((checkpoint, cpIndex) => (
                              <li key={cpIndex} className="flex items-start gap-2 text-blue-700">
                                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {checkpoint}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200">
                <div>
                  {prevLesson && (
                    <Link 
                      href={`/programming/lessons/${prevLesson.order}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous: {prevLesson.title}
                    </Link>
                  )}
                </div>
                
                <div>
                  {nextLesson ? (
                    <Link 
                      href={`/programming/lessons/${nextLesson.order}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Next: {nextLesson.title}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : (
                    <Link 
                      href="/programming/quiz"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      Take Quiz
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="font-semibold text-gray-900 mb-4">Course Progress</h3>
              
              {lessons && (
                <div className="space-y-2">
                  {lessons.map((l, index) => (
                    <Link
                      key={l.order}
                      href={`/programming/lessons/${l.order}`}
                      className={`block p-3 rounded-lg transition-colors ${
                        l.order === lessonOrderNum
                          ? 'bg-blue-100 border border-blue-300 text-blue-900'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          l.order === lessonOrderNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {l.order}
                        </span>
                        <span className="text-sm font-medium">{l.title}</span>
                      </div>
                    </Link>
                  ))}
                  
                  <Link
                    href="/programming/quiz"
                    className="block p-3 rounded-lg transition-colors hover:bg-gray-50 text-gray-700 border-t border-gray-200 mt-4 pt-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-medium">
                        Q
                      </span>
                      <span className="text-sm font-medium">Final Quiz</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}