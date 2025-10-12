"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import TechnologyUtilizationBox from '../../components/TechnologyUtilizationBox';
import EnhancedLoadingComponent from '../../components/EnhancedLoadingComponent';

type ProgrammingLesson = {
    id: number;
    topic: string;
    title: string;
    description: string;
    codeExample: string;
    output: string;
};

type TopicGroup = {
    topic: string;
    lessons: ProgrammingLesson[];
};

const PROGRAMMING_OVERVIEW_QUERY = gql`
  query ProgrammingOverview {
    programmingLessons {
      id
      topic
      title
      description
    }
  }
`;

export default function ProgrammingOverviewPage() {
    const router = useRouter();
    const [retryCount, setRetryCount] = useState(0);
    const { data, loading, error, refetch } = useQuery(PROGRAMMING_OVERVIEW_QUERY);

    // Increment retry count when any error occurs (matching previous behavior)
    useEffect(() => {
        if (error) {
            setRetryCount(prev => prev + 1);
        }
    }, [error]);

    // Reset retry count on successful load
    useEffect(() => {
        if (data && !loading) {
            setRetryCount(0);
        }
    }, [data, loading]);

    const lessons: ProgrammingLesson[] = data?.programmingLessons ?? [];

    // Group lessons by topic
    const topicGroups: TopicGroup[] = Object.values(
        lessons.reduce((acc, lesson) => {
            if (!acc[lesson.topic]) acc[lesson.topic] = { topic: lesson.topic, lessons: [] };
            acc[lesson.topic].lessons.push(lesson);
            return acc;
        }, {} as Record<string, TopicGroup>)
    );

    // If we're loading or have retry attempts, show the enhanced loading component
    if (loading || retryCount > 0) {
        return (
            <div className="w-full p-6">
                <div className="max-w-4xl mx-auto">
                    <EnhancedLoadingComponent 
                        retryCount={retryCount} 
                        maxRetries={30} 
                        error={error}
                        onRetry={() => {
                            setRetryCount(0);
                            refetch();
                        }}
                    />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <main className="p-6">
                <div className="max-w-4xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="text-red-600 dark:text-red-400">Error loading Programming overview.</div>
                    <button 
                        className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors duration-200"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </button>
                </div>
            </main>
        );
    }

    return (
        <div className="w-full p-6">
            <div className="max-w-4xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <Link href="/" className="inline-block mb-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold py-1 px-2 rounded shadow hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-150 flex items-center gap-1 text-xs">
                    <span className="text-base">←</span> Back to Home
                </Link>
                
                <h1 className="text-3xl font-bold mb-2 text-blue-700 dark:text-blue-300">Programming Fundamentals</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Master the core concepts of programming including variables, data types, control structures, and basic algorithms.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                        <h3 className="font-bold text-lg text-blue-700 dark:text-blue-300 mb-2">What You&apos;ll Learn</h3>
                        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                            <li>Variables and Data Types</li>
                            <li>Control Structures (if/else, loops)</li>
                            <li>Functions and Methods</li>
                            <li>Basic Algorithms</li>
                            <li>Problem Solving Techniques</li>
                        </ul>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-700">
                        <h3 className="font-bold text-lg text-green-700 dark:text-green-300 mb-2">Skills You&apos;ll Gain</h3>
                        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                            <li>Logical Thinking</li>
                            <li>Algorithm Design</li>
                            <li>Debugging Skills</li>
                            <li>Code Structure</li>
                            <li>Programming Fundamentals</li>
                        </ul>
                    </div>
                </div>
                
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300">Topics Covered</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {topicGroups.map((group: TopicGroup) => (
                            <div
                                key={group.topic}
                                role="link"
                                tabIndex={0}
                                onClick={() => router.push(`/programming/lessons?topic=${encodeURIComponent(group.topic)}&index=0`)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        router.push(`/programming/lessons?topic=${encodeURIComponent(group.topic)}&index=0`);
                                    }
                                }}
                                className="bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600 cursor-pointer hover:ring-2 hover:ring-blue-400/50"
                                aria-label={`Go to ${group.topic} lessons`}
                            >
                                <Link
                                    href={`/programming/lessons?topic=${encodeURIComponent(group.topic)}&index=0`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="font-bold text-lg text-blue-700 dark:text-blue-300 mb-2 hover:underline"
                                    aria-label={`Go to ${group.topic} lessons`}
                                >
                                    {group.topic}
                                </Link>
                                <p className="text-gray-600 dark:text-gray-300 mb-3">
                                    {group.lessons.length} lessons covering essential concepts
                                </p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {group.lessons.slice(0, 3).map((lesson: ProgrammingLesson, i: number) => (
                                        <Link
                                            key={lesson.id}
                                            href={`/programming/lessons?topic=${encodeURIComponent(group.topic)}&index=${i}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                                            aria-label={`Open ${group.topic} lesson ${i + 1}: ${lesson.title}`}
                                        >
                                            {lesson.title}
                                        </Link>
                                    ))}
                                    {group.lessons.length > 3 && (
                                        <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded">
                                            +{group.lessons.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link 
                        href="/modules/programming-fundamentals/lessons" 
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg shadow hover:from-blue-600 hover:to-indigo-700 transition-all duration-150 font-semibold text-center"
                    >
                        Start Learning
                    </Link>
                    <Link 
                        href="/programming/interview" 
                        className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg shadow hover:from-green-600 hover:to-teal-700 transition-all duration-150 font-semibold text-center"
                    >
                        Take Quiz
                    </Link>
                </div>
                
                <TechnologyUtilizationBox 
                    technology="Programming Fundamentals" 
                    explanation="In this Programming Fundamentals module, core programming concepts are taught using fundamental programming constructs and logic." 
                />
            </div>
        </div>
    );
}