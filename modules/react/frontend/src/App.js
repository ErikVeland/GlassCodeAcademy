import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Lessons from './pages/Lessons';
import LessonDetail from './pages/LessonDetail';
import Quiz from './pages/Quiz';
import QuizResults from './pages/QuizResults';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/lessons/:id" element={<LessonDetail />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/quiz/results" element={<QuizResults />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;