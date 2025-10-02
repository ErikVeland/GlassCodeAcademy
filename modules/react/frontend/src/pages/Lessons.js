import React, { useState, useEffect } from 'react';
import LessonCard from '../components/LessonCard';

const Lessons = () => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, this would fetch from an API
    // For now, we'll use mock data
    const mockLessons = [
      {
        id: 1,
        topic: 'Components',
        title: 'React Components Basics',
        description: 'Learn how to create and use React components.',
        difficulty: 'Beginner'
      },
      {
        id: 2,
        topic: 'Hooks',
        title: 'Understanding React Hooks',
        description: 'Master the useState and useEffect hooks.',
        difficulty: 'Intermediate'
      },
      {
        id: 3,
        topic: 'State Management',
        title: 'Advanced State Management',
        description: 'Learn context API and state management patterns.',
        difficulty: 'Advanced'
      }
    ];
    
    setTimeout(() => {
      setLessons(mockLessons);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading lessons...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">React Lessons</h1>
      
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search lessons..."
          className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.map(lesson => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </div>
  );
};

export default Lessons;