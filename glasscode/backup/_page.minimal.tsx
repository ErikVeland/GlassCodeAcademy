"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gql } from '@apollo/client';
import { getApolloClient } from '../../../apolloClient';

// Update the type to include choice mapping
type LaravelInterviewQuestion = {
    id: number;
    topic: string;
    type: string;
    question: string;
    choices: string[];
    correctAnswer: number;
    explanation: string;
    choiceOrder?: number[]; // Track the order of choices after shuffling
};

interface AnswerResult {
  isCorrect: boolean;
  explanation?: string;
}

const LARAVEL_INTERVIEW_QUESTIONS_QUERY = gql`
  query LaravelInterviewQuestions {
    laravelInterviewQuestions {
      id
      topic
      type
      question
      choices
      correctAnswer
      explanation
    }
  }
`;

const SUBMIT_LARAVEL_ANSWER_MUTATION = gql`
  mutation SubmitLaravelAnswer($questionId: Int!, $answerIndex: Int!) {
    submitLaravelAnswer(questionId: $questionId, answerIndex: $answerIndex) {
      isCorrect
      explanation
    }
  }
`;

export default function LaravelInterviewPage() {
  const [current, setCurrent] = useState(0);
  const [questions, setQuestions] = useState<LaravelInterviewQuestion[]>([]);

  if (questions.length === 0) {
    return (
      <div>
        <h1>No Questions Available</h1>
      </div>
    );
  }

  return (
    <div>
      <h1>Laravel Quiz</h1>
    </div>
  );
}