'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getGraphQLEndpoint } from '@/lib/urlUtils';
import { getInterviewMapping, getSubmitMutationName } from '@/lib/interviewMapping';
import type { BaseInterviewQuestion } from '@/lib/interviewUtils';
import { formatQuestionText } from '@/lib/interviewUtils';

interface AnswerResult {
  isCorrect: boolean;
  explanation?: string;
}

export default function InterviewQuestionsPage() {
  const params = useParams();
  const tech = (params?.tech as string) || '';
  const mapping = useMemo(() => getInterviewMapping(tech), [tech]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<BaseInterviewQuestion[]>([]);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Record<string, AnswerResult>>({});

  useEffect(() => {
    let isMounted = true;
    async function loadQuestions() {
      if (!mapping) {
        setError('Interview questions for this module are not available yet.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const endpoint = getGraphQLEndpoint();
        const query = `query { ${mapping.queryField} { id topic type question choices correctAnswer explanation } }`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        const json = await res.json();
        if (json.errors) {
          throw new Error(json.errors?.[0]?.message || 'Failed to fetch questions');
        }
        const data = json.data?.[mapping.queryField] || [];
        if (isMounted) {
          setQuestions(data as BaseInterviewQuestion[]);
        }
      } catch (e: unknown) {
        const errObj = e as { message?: unknown };
        const msg = typeof errObj?.message === 'string' ? errObj.message : 'Failed to load questions';
        if (isMounted) setError(msg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadQuestions();
    return () => {
      isMounted = false;
    };
  }, [mapping]);

  const handleChoiceSelect = (qid: string, index: number) => {
    setSelectedChoices((prev) => ({ ...prev, [qid]: index }));
  };

  const handleSubmit = async (qid: string) => {
    const question = questions.find((q) => String(q.id) === String(qid));
    if (!question) return;
    const selectedIndex = selectedChoices[qid];
    if (selectedIndex === undefined) return;

    const mutationName = getSubmitMutationName(tech);
    const endpoint = getGraphQLEndpoint();
    const questionId = Number(question.id);
    const mutation = `mutation Submit($qid: Int!, $ans: Int!) { ${mutationName}(questionId: $qid, answerIndex: $ans) { isCorrect explanation } }`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mutation, variables: { qid: questionId, ans: selectedIndex } }),
      });
      const json = await res.json();
      if (json.errors) {
        throw new Error(json.errors?.[0]?.message || 'Failed to submit answer');
      }
      const result: AnswerResult = json.data?.[mutationName];
      setResults((prev) => ({ ...prev, [qid]: result }));
    } catch (e: unknown) {
      const errObj = e as { message?: unknown };
      const msg = typeof errObj?.message === 'string' ? errObj.message : 'Submission failed';
      setResults((prev) => ({ ...prev, [qid]: { isCorrect: false, explanation: msg } }));
    }
  };

  const title = mapping?.title || 'Interview Questions';

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link href="/" className="text-blue-600 hover:text-blue-800">Home</Link>
          </li>
          <li className="text-gray-500">/</li>
          <li>
            <span className="text-gray-700 dark:text-gray-300">Interview Prep</span>
          </li>
          <li className="text-gray-500">/</li>
          <li>
            <span className="text-gray-900 dark:text-white capitalize">{tech}</span>
          </li>
        </ol>
      </nav>

      <div className="glass-morphism px-8 py-8 rounded-xl">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Practice curated {tech} interview questions. Select an answer and submit to check correctness.
        </p>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading questions...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-100 text-red-800 rounded-lg mb-6">{error}</div>
        )}

        {!loading && !error && questions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❓</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">No questions available</h2>
            <p className="text-gray-600 dark:text-gray-300">Check back soon — we are preparing more content.</p>
          </div>
        )}

        {!loading && !error && questions.length > 0 && (
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={String(q.id)} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-500">Question {idx + 1}</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      <span dangerouslySetInnerHTML={{ __html: formatQuestionText(q.question) }} />
                    </h3>
                  </div>
                  {q.topic && (
                    <span className="ml-4 inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {q.topic}
                    </span>
                  )}
                </div>

                {Array.isArray(q.choices) && q.choices.length > 0 ? (
                  <div className="space-y-2">
                    {((q.choices as string[]) || []).map((choice: string, cIdx: number) => (
                      <label key={cIdx} className="flex items-center p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          className="mr-3"
                          checked={selectedChoices[String(q.id)] === cIdx}
                          onChange={() => handleChoiceSelect(String(q.id), cIdx)}
                        />
                        <span
                          className="text-gray-800 dark:text-gray-200"
                          dangerouslySetInnerHTML={{ __html: formatQuestionText(choice) }}
                        />
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-600 dark:text-gray-300">This question has no choices provided.</div>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => handleSubmit(String(q.id))}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Submit Answer
                  </button>
                  {results[String(q.id)] && (
                    <span className={
                      results[String(q.id)].isCorrect
                        ? 'text-green-700'
                        : 'text-red-700'
                    }>
                      {results[String(q.id)].isCorrect ? '✅ Correct' : '❌ Incorrect'}
                    </span>
                  )}
                </div>

                {results[String(q.id)]?.explanation && (
                  <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Explanation</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">{results[String(q.id)]?.explanation}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}