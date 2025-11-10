'use client';

import { useState, useEffect } from 'react';

interface ProgrammingQuestion {
  id: number;
  question: string;
  choices?: string[];
  correctAnswer?: number;
  explanation?: string;
  topic?: string;
  type?: string;
  difficulty?: string;
  estimatedTime?: number;
  order?: number;
}

interface QuizData {
  questions: ProgrammingQuestion[];
}

export default function TestQuizAccess() {
  const [data, setData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Test direct API access
        const res = await fetch('/api/content/quizzes/programming-fundamentals');
        if (!res.ok) {
          throw new Error(`API request failed: ${res.status}`);
        }
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Test Quiz Access</h1>
      <p>Questions count: {data?.questions?.length ?? 0}</p>
      {data?.questions && data.questions.length > 0 && (
        <div>
          <h2>First Question:</h2>
          <p>{data.questions[0].question}</p>
        </div>
      )}
    </div>
  );
}