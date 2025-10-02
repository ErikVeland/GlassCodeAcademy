import React, { useState, useEffect } from 'react';
import QuizQuestion from '../components/QuizQuestion';

const Quiz = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, this would fetch from an API
    // For now, we'll use mock data
    const mockQuestions = [
      {
        id: 1,
        topic: 'Components',
        type: 'multiple-choice',
        question: 'What is the correct way to create a React component?',
        choices: [
          'function MyComponent() { return <div>Hello</div>; }',
          'class MyComponent { render() { return <div>Hello</div>; } }',
          'MyComponent() => { return <div>Hello</div>; }',
          'const MyComponent = { <div>Hello</div> }'
        ],
        correctAnswer: 0,
        explanation: 'In modern React, functional components are the preferred way to create components.'
      },
      {
        id: 2,
        topic: 'Hooks',
        type: 'multiple-choice',
        question: 'Which hook is used to manage state in functional components?',
        choices: [
          'useEffect',
          'useState',
          'useContext',
          'useReducer'
        ],
        correctAnswer: 1,
        explanation: 'The useState hook is used to add state to functional components.'
      }
    ];
    
    setTimeout(() => {
      setQuestions(mockQuestions);
      setLoading(false);
    }, 500);
  }, []);

  const handleAnswerSelect = (questionId, answerIndex) => {
    setAnswers({
      ...answers,
      [questionId]: answerIndex
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading quiz...</div>;
  }

  if (questions.length === 0) {
    return <div className="text-center py-12">No questions available</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">React Quiz</h1>
      <p className="text-gray-600 mb-8">Test your knowledge of React concepts</p>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        <QuizQuestion 
          question={currentQuestion}
          selectedAnswer={answers[currentQuestion.id]}
          onAnswerSelect={(answerIndex) => handleAnswerSelect(currentQuestion.id, answerIndex)}
          showExplanation={submitted}
        />
        
        <div className="flex justify-between mt-8">
          <button 
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className={`px-4 py-2 rounded-lg font-medium ${
              currentQuestionIndex === 0 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            ← Previous
          </button>
          
          {currentQuestionIndex < questions.length - 1 ? (
            <button 
              onClick={handleNextQuestion}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Next →
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Submit Quiz
            </button>
          )}
        </div>
      </div>
      
      {submitted && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz Results</h2>
          <div className="mb-4">
            <p className="text-lg">
              You answered {Object.keys(answers).length} out of {questions.length} questions
            </p>
          </div>
          <a 
            href="/quiz/results" 
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg"
          >
            View Detailed Results
          </a>
        </div>
      )}
    </div>
  );
};

export default Quiz;