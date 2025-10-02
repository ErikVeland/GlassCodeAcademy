import React from 'react';
import { Link } from 'react-router-dom';

const QuizResults = () => {
  // In a real implementation, this would fetch results from state or API
  const results = {
    score: 1,
    total: 2,
    percentage: 50,
    questions: [
      {
        id: 1,
        question: 'What is the correct way to create a React component?',
        selectedAnswer: 0,
        correctAnswer: 0,
        explanation: 'In modern React, functional components are the preferred way to create components.',
        choices: [
          'function MyComponent() { return <div>Hello</div>; }',
          'class MyComponent { render() { return <div>Hello</div>; } }',
          'MyComponent() => { return <div>Hello</div>; }',
          'const MyComponent = { <div>Hello</div> }'
        ]
      },
      {
        id: 2,
        question: 'Which hook is used to manage state in functional components?',
        selectedAnswer: 0, // Incorrect answer
        correctAnswer: 1,
        explanation: 'The useState hook is used to add state to functional components.',
        choices: [
          'useEffect',
          'useState',
          'useContext',
          'useReducer'
        ]
      }
    ]
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Results</h1>
      <p className="text-gray-600 mb-8">Review your answers and explanations</p>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="text-center mb-8">
          <div className="text-6xl font-bold mb-2">
            <span className={getScoreColor(results.percentage)}>{results.score}</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">{results.total}</span>
          </div>
          <div className="text-2xl font-semibold mb-4">
            <span className={getScoreColor(results.percentage)}>
              {results.percentage}% Score
            </span>
          </div>
          <p className="text-gray-600">
            {results.percentage >= 80 
              ? 'Great job! You have a strong understanding of React concepts.' 
              : results.percentage >= 60 
                ? 'Good effort! Review the explanations to improve your knowledge.' 
                : 'Keep studying! Review the lessons and try the quiz again.'}
          </p>
        </div>
        
        <div className="space-y-8">
          {results.questions.map((q, index) => {
            const isCorrect = q.selectedAnswer === q.correctAnswer;
            
            return (
              <div key={q.id} className="border-b border-gray-200 pb-8 last:border-0 last:pb-0">
                <div className="flex items-start mb-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">{q.question}</h3>
                </div>
                
                <div className="ml-11 space-y-3 mb-4">
                  {q.choices.map((choice, choiceIndex) => {
                    let choiceStyle = "block w-full text-left p-3 rounded";
                    
                    if (choiceIndex === q.correctAnswer) {
                      choiceStyle = "block w-full text-left p-3 rounded bg-green-50 border border-green-200";
                    } else if (choiceIndex === q.selectedAnswer && !isCorrect) {
                      choiceStyle = "block w-full text-left p-3 rounded bg-red-50 border border-red-200";
                    } else {
                      choiceStyle = "block w-full text-left p-3 rounded";
                    }
                    
                    return (
                      <div key={choiceIndex} className={choiceStyle}>
                        <div className="flex items-center">
                          {choiceIndex === q.correctAnswer && (
                            <span className="mr-2 text-green-600">✓</span>
                          )}
                          {choiceIndex === q.selectedAnswer && !isCorrect && (
                            <span className="mr-2 text-red-600">✗</span>
                          )}
                          <span>{choice}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className={`ml-11 p-3 rounded-lg ${
                  isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {isCorrect ? 'Correct!' : 'Incorrect!'} The correct answer is: {q.choices[q.correctAnswer]}
                  </p>
                  <p className="mt-2 text-gray-700">{q.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex justify-center space-x-4">
        <Link 
          to="/quiz" 
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg"
        >
          Retake Quiz
        </Link>
        <Link 
          to="/lessons" 
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-lg"
        >
          Back to Lessons
        </Link>
      </div>
    </div>
  );
};

export default QuizResults;