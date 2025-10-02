import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-blue-500 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">React Learning Module</Link>
          <nav>
            <ul className="flex space-x-6">
              <li><Link to="/" className="hover:text-blue-200">Home</Link></li>
              <li><Link to="/lessons" className="hover:text-blue-200">Lessons</Link></li>
              <li><Link to="/quiz" className="hover:text-blue-200">Quiz</Link></li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;