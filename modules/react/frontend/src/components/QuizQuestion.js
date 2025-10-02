import React from 'react';

const QuizQuestion = ({ question, selectedAnswer, onAnswerSelect, showExplanation }) => {
  const isCorrect = selectedAnswer === question.correctAnswer;
  
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{question.question}</h2>
      
      <div className="space-y-3 mb-6">
        {question.choices.map((choice, index) => {
          let choiceStyle = "block w-full text-left p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors";
          
          if (selectedAnswer === index) {
            if (showExplanation) {
              choiceStyle = isCorrect 
                ? "block w-full text-left p-4 border border-green-500 bg-green-50 rounded-lg"
                : "block w-full text-left p-4 border border-red-500 bg-red-50 rounded-lg";
            } else {
              choiceStyle = "block w-full text-left p-4 border border-blue-500 bg-blue-50 rounded-lg";
            }
          } else if (showExplanation && index === question.correctAnswer) {
            choiceStyle = "block w-full text-left p-4 border border-green-500 bg-green-50 rounded-lg";
          } else {
            choiceStyle = "block w-full text-left p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors";
          }
          
          return (
            <label 
              key={index} 
              className={choiceStyle}
              onClick={() => !showExplanation && onAnswerSelect(index)}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={selectedAnswer === index}
                  onChange={() => !showExplanation && onAnswerSelect(index)}
                  className="mr-3 h-4 w-4 text-blue-500"
                  disabled={showExplanation}
                />
                <span>{choice}</span>
              </div>
            </label>
          );
        })}
      </div>
      
      {showExplanation && (
        <div className={`p-4 rounded-lg mb-4 ${
          isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
            {isCorrect ? 'Correct!' : 'Incorrect!'}
          </p>
          <p className="mt-2 text-gray-700">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default QuizQuestion;