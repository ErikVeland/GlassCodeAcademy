'use client';

import { useState } from 'react';
import Link from 'next/link';
import EnhancedLoadingComponent from '../../components/EnhancedLoadingComponent';

export default function GraphQLPlayground() {
  const [query, setQuery] = useState(`# Welcome to the dotNetQuiz GraphQL Playground
# Try running some queries!

query {
  dotNetLessons {
    id
    topic
    title
  }
}`);
  const [variables, setVariables] = useState('{}');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const executeQuery = async () => {
    setLoading(true);
    setError('');
    try {
      // Use the environment variable or default to the hosted backend
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'https://fullstack-academy-backend.onrender.com';
      const graphqlUrl = `${baseUrl}/graphql`;
      
      const res = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: variables ? JSON.parse(variables) : undefined,
        }),
      });

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle manual retry
  const handleManualRetry = () => {
    setRetryCount(0);
    setError('');
    setLoading(true);
    
    // Reset the fetch process
    const fetchGraphQL = async () => {
      try {
        // Use the environment variable or default to the hosted backend
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'https://fullstack-academy-backend.onrender.com';
        const graphqlUrl = `${baseUrl}/graphql`;
        
        const res = await fetch(graphqlUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `# Welcome to the dotNetQuiz GraphQL Playground
# Try running some queries!

query {
  dotNetLessons {
    id
    topic
    title
  }
}`,
            variables: {},
          }),
        });

        const data = await res.json();
        setResponse(JSON.stringify(data, null, 2));
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };
    
    fetchGraphQL();
  };

  // Show loading state
  if (loading) {
    if (retryCount > 0) {
      return (
        <div className="min-h-screen flex flex-col">
          <div 
            className="fixed top-0 left-0 w-full h-full -z-10" 
            style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 25%, #10B981 50%, #F59E0B 75%, #EF4444 100%)',
              animation: 'gradientFlow 45s ease infinite'
            }}
            aria-hidden="true" 
            role="presentation"
          />
          <div className="flex-grow flex items-center justify-center px-4">
            <div className="max-w-md mx-auto">
              <EnhancedLoadingComponent 
                retryCount={retryCount} 
                maxRetries={30} 
                onRetry={handleManualRetry}
              />
            </div>
          </div>
        </div>
      );
    }
    
    // Show initial loading state with glass morphism effect
    return (
      <div className="min-h-screen flex flex-col">
        <div 
          className="fixed top-0 left-0 w-full h-full -z-10" 
          style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 25%, #10B981 50%, #F59E0B 75%, #EF4444 100%)',
            animation: 'gradientFlow 45s ease infinite'
          }}
          aria-hidden="true" 
          role="presentation"
        />
        <div className="flex-grow flex items-center justify-center px-4">
          <div className="max-w-3xl mx-auto w-full">
            <div className="animate-pulse flex flex-col items-center justify-center space-y-6">
              <div className="h-12 w-2/3 bg-white/20 rounded-xl"></div>
              <div className="h-64 w-full bg-white/20 rounded-xl"></div>
              <div className="h-10 w-1/3 bg-white/20 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error only after loading
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <div 
          className="fixed top-0 left-0 w-full h-full -z-10" 
          style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 25%, #10B981 50%, #F59E0B 75%, #EF4444 100%)',
            animation: 'gradientFlow 45s ease infinite'
          }}
          aria-hidden="true" 
          role="presentation"
        />
        <div className="flex-grow flex items-center justify-center px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-white mb-4">Connection Error</h2>
              <p className="mb-6 text-white/80 text-lg">{error}</p>
              <button
                onClick={handleManualRetry}
                className="px-8 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold hover:from-red-600 hover:to-orange-600 transition-all duration-200 shadow-lg"
              >
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    // Updated container with tier-specific gradient background
    <div className="min-h-screen flex flex-col">
      {/* Fixed animated background with tier gradient */}
      <div 
        className="fixed top-0 left-0 w-full h-full -z-10" 
        style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
        }}
        aria-hidden="true" 
        role="presentation"
      />
      
      <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header with consistent design */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="text-4xl">🛝</div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">GraphQL Playground</h1>
                  <p className="text-white/80">Interactive query environment for exploring our GraphQL API</p>
                </div>
              </div>
              <Link 
                href="/" 
                className="bg-white/20 backdrop-blur-sm text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:bg-white/30 transition-all duration-200 flex items-center gap-2 border border-white/20"
              >
                <span className="text-lg">←</span> Back to Home
              </Link>
            </div>
          </div>
        </div>

        {/* Main playground container with glass morphism */}
        <div className="bg-white/10 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden border border-white/20 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">
            {/* Query Section */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
                  📄 Query Editor
                </h2>
                <textarea
                  className="w-full h-80 p-4 border border-white/30 rounded-xl font-mono text-sm bg-white/10 backdrop-blur-sm text-white placeholder-white/50 focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter your GraphQL query here..."
                />
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
                  ⚙️ Variables (JSON)
                </h2>
                <textarea
                  className="w-full h-32 p-4 border border-white/30 rounded-xl font-mono text-sm bg-white/10 backdrop-blur-sm text-white placeholder-white/50 focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                  value={variables}
                  onChange={(e) => setVariables(e.target.value)}
                  placeholder='{"key": "value"}'
                />
              </div>
              
              <button
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
                onClick={executeQuery}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Executing...
                  </>
                ) : (
                  <>
                    ▶️ Execute Query
                  </>
                )}
              </button>
            </div>
            
            {/* Response Section */}
            <div>
              <h2 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
                📊 Response
              </h2>
              {error && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-400/50 text-red-200 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    ⚠️ <strong>Error:</strong>
                  </div>
                  <div className="mt-2">{error}</div>
                </div>
              )}
              <pre className="w-full h-[34rem] p-4 border border-white/30 rounded-xl overflow-auto bg-black/20 backdrop-blur-sm font-mono text-sm text-white scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {response || '// Execute a query to see results\n// Your GraphQL response will appear here'}
              </pre>
            </div>
          </div>
        </div>

        {/* Example queries section */}
        <div className="bg-white/10 backdrop-blur-md shadow-2xl rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-semibold mb-6 text-white flex items-center gap-3">
            📚 Example Queries
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-medium mb-3 text-white flex items-center gap-2">
                  🔵 Get .NET Lessons
                </h3>
                <pre className="p-4 bg-black/20 border border-white/20 rounded-lg overflow-auto font-mono text-sm text-green-300 mb-3">
{`query {
  dotNetLessons {
    id
    topic
    title
    description
  }
}`}
                </pre>
                <button
                  className="text-sm text-blue-300 hover:text-blue-200 underline transition-colors"
                  onClick={() =>
                    setQuery(`query {
  dotNetLessons {
    id
    topic
    title
    description
  }
}`)
                  }
                >
                  → Use this query
                </button>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-medium mb-3 text-white flex items-center gap-2">
                  🔵 Submit Answer
                </h3>
                <pre className="p-4 bg-black/20 border border-white/20 rounded-lg overflow-auto font-mono text-sm text-green-300 mb-3">
{`mutation {
  submitAnswer(questionId: 1, answerIndex: 0) {
    isCorrect
    explanation
  }
}`}
                </pre>
                <button
                  className="text-sm text-blue-300 hover:text-blue-200 underline transition-colors"
                  onClick={() =>
                    setQuery(`mutation {
  submitAnswer(questionId: 1, answerIndex: 0) {
    isCorrect
    explanation
  }
}`)
                  }
                >
                  → Use this query
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-medium mb-3 text-white flex items-center gap-2">
                  🔵 Get Interview Questions
                </h3>
                <pre className="p-4 bg-black/20 border border-white/20 rounded-lg overflow-auto font-mono text-sm text-green-300 mb-3">
{`query {
  dotNetInterviewQuestions {
    id
    topic
    type
    question
    choices
  }
}`}
                </pre>
                <button
                  className="text-sm text-blue-300 hover:text-blue-200 underline transition-colors"
                  onClick={() =>
                    setQuery(`query {
  dotNetInterviewQuestions {
    id
    topic
    type
    question
    choices
  }
}`)
                  }
                >
                  → Use this query
                </button>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-medium mb-3 text-white flex items-center gap-2">
                  🔵 Filter & Sort
                </h3>
                <pre className="p-4 bg-black/20 border border-white/20 rounded-lg overflow-auto font-mono text-sm text-green-300 mb-3">
{`query {
  dotNetLessons(
    topic: "OOP"
    sortBy: "id"
    sortOrder: "asc"
    limit: 5
    offset: 0
  ) {
    id
    title
  }
}`}
                </pre>
                <button
                  className="text-sm text-blue-300 hover:text-blue-200 underline transition-colors"
                  onClick={() =>
                    setQuery(`query {
  dotNetLessons(
    topic: "OOP"
    sortBy: "id"
    sortOrder: "asc"
    limit: 5
    offset: 0
  ) {
    id
    title
  }
}`)
                  }
                >
                  → Use this query
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}