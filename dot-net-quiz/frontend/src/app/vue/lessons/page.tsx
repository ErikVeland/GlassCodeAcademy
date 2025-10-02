"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, gql } from '@apollo/client';
import TechnologyUtilizationBox from '../../../components/TechnologyUtilizationBox';
import EnhancedLoadingComponent from '../../../components/EnhancedLoadingComponent';

type VueLesson = {
    id: number;
    topic: string;
    title: string;
    description: string;
    codeExample: string;
    output: string;
};

type TopicGroup = {
    topic: string;
    lessons: VueLesson[];
};

const VUE_LESSONS_QUERY = gql`
  query VueLessons {
    vueLessons {
      id
      topic
      title
      description
      codeExample
      output
    }
  }
`;

export default function VueLessonsPage() {
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const retryCountRef = useRef(0);

    const { data, loading, error, refetch } = useQuery(VUE_LESSONS_QUERY, {
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

    const lessons: VueLesson[] = data?.vueLessons ?? [];

    // Group lessons by topic
    const topicGroups: TopicGroup[] = Object.values(
        lessons.reduce((acc, lesson) => {
            if (!acc[lesson.topic]) acc[lesson.topic] = { topic: lesson.topic, lessons: [] };
            acc[lesson.topic].lessons.push(lesson);
            return acc;
        }, {} as Record<string, TopicGroup>)
    );

    // If a lesson is selected, find its topic and index
    let currentLesson: VueLesson | null = null;
    let currentTopicLessons: VueLesson[] = [];
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
                <div className="max-w-4xl mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="text-red-600 dark:text-red-400">Error loading Vue.js lessons.</div>
                    <button 
                        className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </button>
                </div>
            </main>
        );
    }

    return (
        // Removed double background - now using single main background
        <div className="w-full p-6">
            {/* Simplified container without additional glass effect */}
            <div className="max-w-4xl mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <Link 
                  href="/" 
                  className="inline-block mb-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 font-semibold py-1 px-3 rounded shadow hover:bg-green-200 dark:hover:bg-green-800 transition-colors duration-150 flex items-center gap-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  aria-label="Back to home"
                >
                    <span className="text-base">←</span> Back to Home
                </Link>
                <h1 className="text-3xl font-bold mb-6 mt-2 text-green-700 dark:text-green-300">Learn Vue.js Step by Step</h1>

                {/* Topic Overview */}
                {selectedTopic === null && (
                    <div>
                        {topicGroups.map(group => (
                            <div key={group.topic} className="mb-10">
                                <h2 className="text-2xl font-extrabold mb-4 flex items-center gap-2 text-green-700 dark:text-green-300">
                                    <span className="inline-block h-8 w-2 rounded bg-green-500 dark:bg-green-400 mr-3"></span>
                                    <span className="bg-green-50 dark:bg-green-900 px-4 py-2 rounded-lg text-green-800 dark:text-green-200 shadow-sm">{group.topic}</span>
                                </h2>
                                <ul className="space-y-3">
                                    {group.lessons.map((lesson, idx) => (
                                        <li
                                            key={lesson.id}
                                            className="bg-gray-100/50 dark:bg-gray-700/50 backdrop-blur-sm p-4 rounded shadow hover:bg-green-50 dark:hover:bg-green-900 cursor-pointer transition-colors duration-150 border border-gray-200 dark:border-gray-600 focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-2"
                                            onClick={() => {
                                                setSelectedTopic(group.topic);
                                                setSelectedIndex(idx);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    setSelectedTopic(group.topic);
                                                    setSelectedIndex(idx);
                                                }
                                            }}
                                            tabIndex={0}
                                            role="button"
                                            aria-label={`View lesson: ${lesson.title}`}
                                        >
                                            <div className="font-semibold text-green-700 dark:text-green-300">{lesson.title}</div>
                                            <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">{lesson.description}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                        <TechnologyUtilizationBox 
                            technology="Vue.js" 
                            explanation="In this Vue.js module, Vue is being used as the core frontend framework to build the entire user interface. Vue components manage the state and rendering of the lesson content and quiz questions." 
                        />
                    </div>
                )}

                {/* Lesson Detail View */}
                {selectedTopic !== null && currentLesson && (
                    // Simplified container without additional glass effect
                    <div className="bg-gray-100/50 dark:bg-gray-700/50 backdrop-blur-sm p-6 rounded-xl shadow-lg space-y-4 mt-4 border border-gray-200 dark:border-gray-600">
                        <button
                            className="w-full mb-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 font-semibold py-2 rounded shadow hover:bg-green-200 dark:hover:bg-green-800 transition-colors duration-150 flex items-center justify-center gap-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            onClick={() => {
                                setSelectedTopic(null);
                                setSelectedIndex(null);
                            }}
                            aria-label="Back to topic list"
                        >
                            <span className="text-base">←</span> Back to Topic List
                        </button>

                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-green-700 dark:text-green-300">{currentLesson.topic}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Lesson {currentLessonIndex! + 1} of {currentTopicLessons.length}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentLesson.title}</h2>
                        <p className="text-gray-700 dark:text-gray-300">{currentLesson.description}</p>

                        <div>
                            <h3 className="font-semibold mt-4 text-green-700 dark:text-green-300">Code Example:</h3>
                            <pre className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4 rounded text-sm whitespace-pre-wrap border border-gray-200 dark:border-gray-600 overflow-x-auto focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-2">
                                <code className="text-gray-800 dark:text-gray-200">{currentLesson.codeExample}</code>
                            </pre>
                        </div>

                        <div>
                            <h3 className="font-semibold mt-4 text-green-700 dark:text-green-300">Expected Output:</h3>
                            <pre className="bg-black/50 text-white p-4 rounded text-sm whitespace-pre-wrap overflow-x-auto border border-gray-700 dark:border-gray-600 focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-2">
                                {currentLesson.output}
                            </pre>
                        </div>

                        <TechnologyUtilizationBox 
                            technology="Vue.js" 
                            explanation="In this Vue.js module, Vue is being used as the core frontend framework to build the entire user interface. Vue components manage the state and rendering of the lesson content and quiz questions." 
                        />

                        <div className="flex flex-col sm:flex-row justify-between mt-6 gap-4">
                            {/* Previous button */}
                            {currentLessonIndex! > 0 ? (
                                <button
                                    className="flex-1 bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded shadow hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-150 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                    onClick={() => setSelectedIndex(currentLessonIndex! - 1)}
                                    aria-label={`Previous lesson: ${currentTopicLessons[currentLessonIndex! - 1].title}`}
                                >
                                    <span className="mr-2">←</span> {currentTopicLessons[currentLessonIndex! - 1].title}
                                </button>
                            ) : (
                                <button
                                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-400 dark:text-gray-400 px-4 py-2 rounded shadow cursor-not-allowed"
                                    disabled
                                    aria-label="No previous lesson"
                                >
                                    &nbsp;
                                </button>
                            )}
                            {/* Next button */}
                            {currentLessonIndex! < currentTopicLessons.length - 1 ? (
                                <button
                                    className="flex-1 bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded shadow hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-150 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                    onClick={() => setSelectedIndex(currentLessonIndex! + 1)}
                                    aria-label={`Next lesson: ${currentTopicLessons[currentLessonIndex! + 1].title}`}
                                >
                                    {currentTopicLessons[currentLessonIndex! + 1].title} <span className="ml-2">→</span>
                                </button>
                            ) : (
                                <button
                                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-400 dark:text-gray-400 px-4 py-2 rounded shadow cursor-not-allowed"
                                    disabled
                                    aria-label="No next lesson"
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
                                            className="flex-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-4 py-2 rounded shadow hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-150 font-semibold text-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                                            aria-label="Exit lessons and return to home"
                                        >
                                            Exit Lessons
                                        </Link>
                                        <Link 
                                            href="/vue/interview" 
                                            className="flex-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white px-4 py-2 rounded shadow hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 transition-all duration-150 font-semibold text-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                            aria-label="Start Vue.js quiz"
                                        >
                                            Start Vue.js Quiz
                                        </Link>
                                    </div>
                                ) : (
                                    <button
                                        className="w-full mt-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-4 py-2 rounded shadow hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-150 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                                        onClick={() => {
                                            setSelectedTopic(nextCategoryTopic);
                                            setSelectedIndex(0);
                                        }}
                                        aria-label={`Go to next category: ${nextCategoryTopic}`}
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