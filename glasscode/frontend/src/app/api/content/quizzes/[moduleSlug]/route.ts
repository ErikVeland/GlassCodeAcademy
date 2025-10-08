import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getGraphQLEndpoint } from '@/lib/urlUtils';

// For programming fundamentals, we'll use GraphQL to fetch data from the backend
async function fetchProgrammingQuestions() {
  try {
    const graphqlEndpoint = getGraphQLEndpoint();
    
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
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
        `,
      }),
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed with status ${response.status}`);
    }

    const result = await response.json();
    return result.data?.programmingInterviewQuestions || [];
  } catch (error) {
    console.error('Failed to fetch programming questions via GraphQL:', error);
    return [];
  }
}