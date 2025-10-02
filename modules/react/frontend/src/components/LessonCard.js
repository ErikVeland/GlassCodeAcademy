import React from 'react';
import { Link } from 'react-router-dom';

const LessonCard = ({ lesson }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-gray-900">{lesson.title}</h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(lesson.difficulty)}`}>
            {lesson.difficulty}
          </span>
        </div>
        
        <p className="text-sm text-gray-500 mb-1">{lesson.topic}</p>
        <p className="text-gray-600 mb-4">{lesson.description}</p>
        
        <Link 
          to={`/lessons/${lesson.id}`} 
          className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300"
        >
          Start Lesson
        </Link>
      </div>
    </div>
  );
};

export default LessonCard;