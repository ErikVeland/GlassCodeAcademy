import { gql } from '@apollo/client';

// Query for programming fundamentals lessons
export const GET_PROGRAMMING_LESSONS = gql`
  query GetProgrammingLessons {
    programmingLessons {
      id
      topic
      title
      description
      codeExample
      output
      order
    }
  }
`;

// Query for programming fundamentals interview questions
export const GET_PROGRAMMING_QUESTIONS = gql`
  query GetProgrammingQuestions {
    programmingInterviewQuestions {
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

// Query for a specific programming lesson by ID
export const GET_PROGRAMMING_LESSON = gql`
  query GetProgrammingLesson($id: Int!) {
    programmingLessons(id: $id) {
      id
      topic
      title
      description
      codeExample
      output
      order
    }
  }
`;