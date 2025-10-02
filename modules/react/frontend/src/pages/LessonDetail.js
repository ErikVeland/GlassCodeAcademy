import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CodeExample from '../components/CodeExample';

const LessonDetail = () => {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, this would fetch from an API
    // For now, we'll use mock data
    const mockLesson = {
      id: parseInt(id),
      topic: 'Components',
      title: 'React Components Basics',
      description: 'Learn how to create and use React components.',
      content: `React components are the building blocks of any React application. They allow you to split your UI into independent, reusable pieces, and think about each piece in isolation.

There are two types of components in React:
1. Function components
2. Class components

In modern React, function components are preferred, especially with the introduction of hooks.`,
      codeExample: `function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}

function App() {
  return (
    <div>
      <Welcome name="Sara" />
      <Welcome name="Cahal" />
      <Welcome name="Edite" />
    </div>
  );
}`,
      output: `Hello, Sara
Hello, Cahal
Hello, Edite`,
      difficulty: 'Beginner'
    };
    
    setTimeout(() => {
      setLesson(mockLesson);
      setLoading(false);
    }, 500);
  }, [id]);

  if (loading) {
    return <div className="text-center py-12">Loading lesson...</div>;
  }

  if (!lesson) {
    return <div className="text-center py-12">Lesson not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <nav className="mb-6 text-sm text-gray-500">
        <span>Lessons</span> / <span>{lesson.topic}</span> / <span className="text-gray-900">{lesson.title}</span>
      </nav>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {lesson.topic}
          </span>
        </div>
        
        <p className="text-gray-600 mb-6">{lesson.description}</p>
        
        <div className="prose max-w-none mb-8">
          <p className="mb-4">{lesson.content}</p>
        </div>
        
        <CodeExample code={lesson.codeExample} output={lesson.output} />
        
        <div className="flex justify-between mt-8">
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg">
            ← Previous Lesson
          </button>
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg">
            Next Lesson →
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonDetail;