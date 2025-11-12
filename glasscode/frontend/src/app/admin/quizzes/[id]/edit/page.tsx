"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { AdminQuiz, AdminLesson } from "@/types/admin";

export default function EditQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [quiz, setQuiz] = useState<AdminQuiz | null>(null);
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [resolvedId, setResolvedId] = useState<string | null>(null);

  const fetchData = useCallback(async (id: string) => {
    try {
      setLoading(true);

      const quizRes = await fetch(`/api/LessonQuiz/${id}`);
      const quizData = await quizRes.json();
      setQuiz(quizData as AdminQuiz);

      const lessonsRes = await fetch("/api/lessons-db");
      const lessonsData = await lessonsRes.json();
      setLessons(lessonsData as AdminLesson[]);

      setLoading(false);
    } catch (err) {
      setError("Failed to fetch data");
      setLoading(false);
      console.error(err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.resolve(params)
      .then((p) => {
        if (!mounted) return;
        setResolvedId(p.id);
        fetchData(p.id);
      })
      .catch((err) => {
        console.error("Error resolving params", err);
        setError("Failed to resolve route params");
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [params, fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;

    try {
      setSaving(true);

      let choices = quiz.choices;
      let tags = quiz.tags;
      let sources = quiz.sources;

      try {
        choices =
          typeof quiz.choices === "string"
            ? JSON.parse(quiz.choices)
            : quiz.choices;
      } catch {
        choices = quiz.choices;
      }

      try {
        tags =
          typeof quiz.tags === "string" ? JSON.parse(quiz.tags) : quiz.tags;
      } catch {
        tags = quiz.tags;
      }

      try {
        sources =
          typeof quiz.sources === "string"
            ? JSON.parse(quiz.sources)
            : quiz.sources;
      } catch {
        sources = quiz.sources;
      }

      const response = await fetch(`/api/LessonQuiz/${quiz.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: quiz.question,
          topic: quiz.topic,
          difficulty: quiz.difficulty,
          choices: choices,
          explanation: quiz.explanation,
          industryContext: quiz.industryContext,
          tags: tags,
          questionType: quiz.questionType,
          estimatedTime: quiz.estimatedTime,
          correctAnswer:
            typeof quiz.correctAnswer === "string"
              ? parseInt(quiz.correctAnswer)
              : (quiz.correctAnswer ?? null),
          quizType: quiz.quizType,
          sources: sources,
          sortOrder: quiz.sortOrder,
          isPublished: quiz.isPublished,
          lessonId: quiz.lessonId,
        }),
      });

      if (response.ok) {
        router.push("/admin");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update quiz");
      }
    } catch (err) {
      setError("Failed to update quiz");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    if (!quiz) return;
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setQuiz({
      ...quiz,
      [name]: type === "checkbox" ? checked : value,
    } as AdminQuiz);
  };

  const handleChoicesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!quiz) return;
    setQuiz({
      ...quiz,
      choices: e.target.value,
    });
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!quiz) return;
    setQuiz({
      ...quiz,
      tags: e.target.value,
    });
  };

  const handleSourcesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!quiz) return;
    setQuiz({
      ...quiz,
      sources: e.target.value,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Edit Quiz Question
            </h1>
            <p className="text-lg text-gray-600">Loading quiz data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Edit Quiz Question
            </h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-800">{error}</p>
              <button
                onClick={() => resolvedId && fetchData(resolvedId)}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Edit Quiz Question
            </h1>
            <p className="text-lg text-gray-600">Quiz question not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <svg
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">
              Edit Quiz Question
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-8">
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="question"
                  className="block text-sm font-medium text-gray-700"
                >
                  Question
                </label>
                <textarea
                  name="question"
                  id="question"
                  rows={3}
                  value={quiz.question}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="topic"
                  className="block text-sm font-medium text-gray-700"
                >
                  Topic
                </label>
                <input
                  type="text"
                  name="topic"
                  id="topic"
                  value={quiz.topic}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="difficulty"
                  className="block text-sm font-medium text-gray-700"
                >
                  Difficulty
                </label>
                <select
                  name="difficulty"
                  id="difficulty"
                  value={quiz.difficulty}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="questionType"
                  className="block text-sm font-medium text-gray-700"
                >
                  Question Type
                </label>
                <select
                  name="questionType"
                  id="questionType"
                  value={quiz.questionType}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="open-ended">Open Ended</option>
                  <option value="true-false">True/False</option>
                  <option value="coding">Coding</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="choices"
                  className="block text-sm font-medium text-gray-700"
                >
                  Choices (JSON Array)
                </label>
                <textarea
                  name="choices"
                  id="choices"
                  rows={4}
                  value={quiz.choices}
                  onChange={handleChoicesChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono text-xs"
                  placeholder='["Choice 1", "Choice 2", "Choice 3", "Choice 4"]'
                />
                <p className="mt-1 text-sm text-gray-500">
                  JSON array of answer choices. For multiple choice questions.
                </p>
              </div>

              <div>
                <label
                  htmlFor="correctAnswer"
                  className="block text-sm font-medium text-gray-700"
                >
                  Correct Answer Index
                </label>
                <input
                  type="number"
                  name="correctAnswer"
                  id="correctAnswer"
                  value={quiz.correctAnswer || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="0-based index of correct choice"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Index of the correct choice in the choices array (0-based).
                </p>
              </div>

              <div>
                <label
                  htmlFor="explanation"
                  className="block text-sm font-medium text-gray-700"
                >
                  Explanation
                </label>
                <textarea
                  name="explanation"
                  id="explanation"
                  rows={3}
                  value={quiz.explanation}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="industryContext"
                  className="block text-sm font-medium text-gray-700"
                >
                  Industry Context
                </label>
                <textarea
                  name="industryContext"
                  id="industryContext"
                  rows={2}
                  value={quiz.industryContext}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="tags"
                  className="block text-sm font-medium text-gray-700"
                >
                  Tags (JSON Array)
                </label>
                <textarea
                  name="tags"
                  id="tags"
                  rows={2}
                  value={quiz.tags}
                  onChange={handleTagsChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono text-xs"
                  placeholder='["tag1", "tag2", "tag3"]'
                />
              </div>

              <div>
                <label
                  htmlFor="sources"
                  className="block text-sm font-medium text-gray-700"
                >
                  Sources (JSON Array)
                </label>
                <textarea
                  name="sources"
                  id="sources"
                  rows={2}
                  value={quiz.sources}
                  onChange={handleSourcesChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono text-xs"
                  placeholder='["https://example.com/source1", "https://example.com/source2"]'
                />
              </div>

              <div>
                <label
                  htmlFor="estimatedTime"
                  className="block text-sm font-medium text-gray-700"
                >
                  Estimated Time (seconds)
                </label>
                <input
                  type="number"
                  name="estimatedTime"
                  id="estimatedTime"
                  value={quiz.estimatedTime}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="sortOrder"
                  className="block text-sm font-medium text-gray-700"
                >
                  Sort Order
                </label>
                <input
                  type="number"
                  name="sortOrder"
                  id="sortOrder"
                  value={quiz.sortOrder}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="lessonId"
                  className="block text-sm font-medium text-gray-700"
                >
                  Lesson
                </label>
                <select
                  name="lessonId"
                  id="lessonId"
                  value={quiz.lessonId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                >
                  <option value="">Select a lesson</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  id="isPublished"
                  name="isPublished"
                  type="checkbox"
                  checked={quiz.isPublished}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isPublished"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Published
                </label>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
