"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, gql } from '@apollo/client';
import EnhancedLoadingComponent from '../../../components/EnhancedLoadingComponent';

type SassLesson = {
    id: number;
    topic: string;
    title: string;
    description: string;
    codeExample: string;
    output: string;
};

type TopicGroup = {
    topic: string;
    lessons: SassLesson[];
};

const SASS_LESSONS_QUERY = gql`
  query SassLessons {
    sassLessons {
      id
      topic
      title
      description
      codeExample
      output
    }
  }
`;

export default function SassLessonsPage() {
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const retryCountRef = useRef(0);

    const { data, loading, error, refetch } = useQuery(SASS_LESSONS_QUERY, {
        onError: (error) => {
            // Increment retry counter for network errors
            if (isNetworkError(error)) {
                retryCountRef.current += 1;
            }
        }
    });
    
    // Reset retry count on successful load
    useEffect(() => {
        if (data && !loading) {
            retryCountRef.current = 0;
        }
    }, [data, loading]);

    const lessons: SassLesson[] = data?.sassLessons ?? [];

    // Group lessons by topic
    const topicGroups: TopicGroup[] = Object.values(
        lessons.reduce((acc, lesson) => {
            if (!acc[lesson.topic]) acc[lesson.topic] = { topic: lesson.topic, lessons: [] };
            acc[lesson.topic].lessons.push(lesson);
            return acc;
        }, {} as Record<string, TopicGroup>)
    );

    // If a lesson is selected, find its topic and index
    let currentLesson: SassLesson | null = null;
    let currentTopicLessons: SassLesson[] = [];
    let currentLessonIndex: number | null = null;
    let isLastCategory = false;
    let nextCategoryTopic: string | null = null;
    if (selectedTopic !== null && selectedIndex !== null) {
        currentTopicLessons = topicGroups.find(tg => tg.topic === selectedTopic)?.lessons ?? [];
        currentLesson = currentTopicLessons[selectedIndex] ?? null;
        currentLessonIndex = selectedIndex;
        // Find the next topic (cycle to first if at end)
        const currentTopicIdx = topicGroups.findIndex(tg => tg.topic === selectedTopic);
        isLastCategory = currentTopicIdx === topicGroups.length - 1;
        nextCategoryTopic = topicGroups[(currentTopicIdx + 1) % topicGroups.length]?.topic ?? null;
    }

    // Helper function to determine if an error is a network error
    const isNetworkError = (error: any): boolean => {
        return !!error && (
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('NetworkError') ||
            error.message?.includes('ECONNREFUSED') ||
            error.message?.includes('timeout') ||
            error.networkError
        );
    };

    // If we're loading or have retry attempts, show the enhanced loading component
    if (loading || retryCountRef.current > 0) {
        return (
            <div className="w-full p-6">
                <div className="max-w-4xl mx-auto">
                    <EnhancedLoadingComponent 
                        retryCount={retryCountRef.current} 
                        maxRetries={30} 
                        error={error}
                        onRetry={() => {
                            retryCountRef.current = 0;
                            refetch();
                        }}
                    />
                </div>
            </div>
        );
    }
    
    if (error && !isNetworkError(error)) {
        return (
            <main className="p-6">
                <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
                    <div className="text-red-600">Error loading SASS lessons.</div>
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
            <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
                <Link href="/" className="inline-block mb-4 bg-pink-100 text-pink-800 font-semibold py-1 px-2 rounded shadow hover:bg-pink-200 transition-colors duration-150 flex items-center gap-1 text-xs">
                    <span className="text-base">←</span> Back to Home
                </Link>
                <h1 className="text-3xl font-bold mb-6 mt-2 text-pink-700">Learn SASS Step by Step</h1>

                {/* Topic Overview */}
                {selectedTopic === null && (
                    <div>
                        {topicGroups.map(group => (
                            <div key={group.topic} className="mb-10">
                                <h2 className="text-2xl font-extrabold mb-4 flex items-center gap-2 text-pink-700">
                                    <span className="inline-block h-8 w-2 rounded bg-pink-500 mr-3"></span>
                                    <span className="bg-pink-50 px-4 py-2 rounded-lg text-pink-800 shadow-sm">{group.topic}</span>
                                </h2>
                                <ul className="space-y-2">
                                    {group.lessons.map((lesson, idx) => (
                                        <li
                                            key={lesson.id}
                                            className="bg-gray-100/80 backdrop-blur-sm p-4 rounded shadow hover:bg-pink-50 cursor-pointer transition-colors duration-150 border border-gray-200"
                                            onClick={() => {
                                                setSelectedTopic(group.topic);
                                                setSelectedIndex(idx);
                                            }}
                                        >
                                            <div className="font-semibold text-pink-700">{lesson.title}</div>
                                            <p className="text-gray-600 mt-1 text-sm">{lesson.description}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}

                {/* Lesson Detail View */}
                {selectedTopic !== null && currentLesson && (
                    <div className="bg-gray-100/80 backdrop-blur-sm p-6 rounded-xl shadow-lg space-y-4 mt-4 border border-gray-200">
                        <button
                            className="w-full mb-4 bg-pink-100 text-pink-800 font-semibold py-1 rounded shadow hover:bg-pink-200 transition-colors duration-150 flex items-center justify-center gap-1 text-xs"
                            onClick={() => {
                                setSelectedTopic(null);
                                setSelectedIndex(null);
                            }}
                        >
                            <span className="text-base">←</span> Back to Topic List
                        </button>

                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-pink-700">{currentLesson.topic}</span>
                            <span className="text-sm text-gray-600">Lesson {currentLessonIndex! + 1} of {currentTopicLessons.length}</span>
                        </div>
                        <h2 className="text-2xl font-bold">{currentLesson.title}</h2>
                        <p className="text-gray-700">{currentLesson.description}</p>

                        <div>
                            <h3 className="font-semibold mt-4 text-pink-700">SASS Example:</h3>
                            <pre className="bg-white/80 backdrop-blur-sm p-4 rounded text-sm whitespace-pre-wrap border border-gray-200 overflow-x-auto">
                                <code>{currentLesson.codeExample}</code>
                            </pre>
                        </div>

                        <div>
                            <h3 className="font-semibold mt-4 text-pink-700">Expected Output:</h3>
                            <pre className="bg-black/80 text-white p-4 rounded text-sm whitespace-pre-wrap overflow-x-auto border border-gray-700">
                                {currentLesson.output}
                            </pre>
                        </div>

                        <div className="flex justify-between mt-6 gap-4">
                            {/* Previous button (always left) */}
                            {currentLessonIndex! > 0 ? (
                                <button
                                    className="w-1/2 bg-pink-600 text-white px-4 py-2 rounded shadow hover:bg-pink-700 transition-colors duration-150 flex items-center"
                                    onClick={() => setSelectedIndex(currentLessonIndex! - 1)}
                                >
                                    <span className="mr-2">←</span> {currentTopicLessons[currentLessonIndex! - 1].title}
                                </button>
                            ) : (
                                <button
                                    className="w-1/2 bg-gray-300 text-gray-400 px-4 py-2 rounded shadow cursor-not-allowed"
                                    disabled
                                >
                                    &nbsp;
                                </button>
                            )}
                            {/* Next button (always right) */}
                            {currentLessonIndex! < currentTopicLessons.length - 1 ? (
                                <button
                                    className="w-1/2 bg-pink-600 text-white px-4 py-2 rounded shadow hover:bg-pink-700 transition-colors duration-150 flex items-center justify-end"
                                    onClick={() => setSelectedIndex(currentLessonIndex! + 1)}
                                >
                                    {currentTopicLessons[currentLessonIndex! + 1].title} <span className="ml-2">→</span>
                                </button>
                            ) : (
                                <button
                                    className="w-1/2 bg-gray-300 text-gray-400 px-4 py-2 rounded shadow cursor-not-allowed"
                                    disabled
                                >
                                    &nbsp;
                                </button>
                            )}
                        </div>
                        {currentLessonIndex === currentTopicLessons.length - 1 && topicGroups.length > 1 && (
                            <>
                                {isLastCategory ? (
                                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                        <Link 
                                            href="/" 
                                            className="flex-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-4 py-2 rounded shadow hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-150 font-semibold text-center"
                                        >
                                            Exit Lessons
                                        </Link>
                                        <Link 
                                            href="/sass/interview" 
                                            className="flex-1 bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white px-4 py-2 rounded shadow hover:from-pink-600 hover:via-rose-600 hover:to-red-600 transition-all duration-150 font-semibold text-center"
                                        >
                                            Start SASS Quiz
                                        </Link>
                                    </div>
                                ) : (
                                    <button
                                        className="w-full mt-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-4 py-2 rounded shadow hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-150 font-semibold"
                                        onClick={() => {
                                            setSelectedTopic(nextCategoryTopic);
                                            setSelectedIndex(0);
                                        }}
                                    >
                                        Next Category: {nextCategoryTopic} →
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}