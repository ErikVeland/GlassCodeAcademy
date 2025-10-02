import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Learn React with Fullstack Academy</h1>
        <p className="text-xl text-gray-600 mb-8">
          Master React concepts through interactive lessons and quizzes
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Interactive Lessons</h2>
          <p className="text-gray-600 mb-4">
            Learn React concepts with hands-on examples and live code editors
          </p>
          <Link to="/lessons" className="text-blue-500 hover:text-blue-700 font-medium">
            Start Learning →
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Practice Quizzes</h2>
          <p className="text-gray-600 mb-4">
            Test your knowledge with interactive quizzes and get instant feedback
          </p>
          <Link to="/quiz" className="text-blue-500 hover:text-blue-700 font-medium">
            Take Quiz →
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Track Progress</h2>
          <p className="text-gray-600 mb-4">
            Monitor your learning progress and earn certificates
          </p>
          <Link to="/lessons" className="text-blue-500 hover:text-blue-700 font-medium">
            View Progress →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;