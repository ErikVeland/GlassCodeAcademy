'use client'

import { useState } from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-700/80 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 backdrop-blur-sm"
      >
        <span className="sr-only">Open main menu</span>
        {/* Hamburger icon */}
        <svg className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        {/* Close icon */}
        <svg className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Mobile menu panel */}
      <div className={`${isOpen ? 'block' : 'hidden'} absolute top-16 left-0 right-0 z-[1000] bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg dark:shadow-gray-700 border-t border-gray-200 dark:border-gray-700`}>
        <div className="pt-2 pb-3 space-y-1">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">.NET</div>
          <Link
            href="/lessons"
            className={`${isActive('/lessons') ? 'bg-blue-50/80 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-200' : 'border-transparent text-gray-600 hover:bg-blue-50/80 hover:border-gray-300 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-blue-900/50 dark:hover:text-white'} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm`}
            onClick={() => setIsOpen(false)}
          >
            Lessons
          </Link>
          <Link
            href="/interview"
            className={`${isActive('/interview') ? 'bg-blue-50/80 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-200' : 'border-transparent text-gray-600 hover:bg-blue-50/80 hover:border-gray-300 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-blue-900/50 dark:hover:text-white'} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm`}
            onClick={() => setIsOpen(false)}
          >
            Interview Quiz
          </Link>
          
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-4">Next.js</div>
          <Link
            href="/nextjs/lessons"
            className={`${isActive('/nextjs/lessons') ? 'bg-purple-50/80 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-200' : 'border-transparent text-gray-600 hover:bg-gray-50/80 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white'} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm`}
            onClick={() => setIsOpen(false)}
          >
            Lessons
          </Link>
          <Link
            href="/nextjs/interview"
            className={`${isActive('/nextjs/interview') ? 'bg-purple-50/80 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-200' : 'border-transparent text-gray-600 hover:bg-gray-50/80 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white'} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm`}
            onClick={() => setIsOpen(false)}
          >
            Interview Quiz
          </Link>
          
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-4">GraphQL</div>
          <Link
            href="/graphql/lessons"
            className={`${isActive('/graphql/lessons') ? 'bg-pink-50/80 dark:bg-pink-900/30 border-pink-500 text-pink-700 dark:text-pink-200' : 'border-transparent text-gray-600 hover:bg-gray-50/80 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white'} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm`}
            onClick={() => setIsOpen(false)}
          >
            Lessons
          </Link>
          <Link
            href="/graphql/interview"
            className={`${isActive('/graphql/interview') ? 'bg-pink-50/80 dark:bg-pink-900/30 border-pink-500 text-pink-700 dark:text-pink-200' : 'border-transparent text-gray-600 hover:bg-gray-50/80 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white'} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm`}
            onClick={() => setIsOpen(false)}
          >
            Interview Quiz
          </Link>
          
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-4">Laravel</div>
          <Link
            href="/laravel/lessons"
            className={`${isActive('/laravel/lessons') ? 'bg-red-50/80 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-200' : 'border-transparent text-gray-600 hover:bg-gray-50/80 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white'} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm`}
            onClick={() => setIsOpen(false)}
          >
            Lessons
          </Link>
          <Link
            href="/laravel/interview"
            className={`${isActive('/laravel/interview') ? 'bg-red-50/80 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-200' : 'border-transparent text-gray-600 hover:bg-gray-50/80 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white'} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm`}
            onClick={() => setIsOpen(false)}
          >
            Interview Quiz
          </Link>
          
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-4">React</div>
          <Link
            href="/react/lessons"
            className={`${isActive('/react/lessons') ? 'bg-blue-50/80 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-200' : 'border-transparent text-gray-600 hover:bg-blue-50/80 hover:border-gray-300 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-blue-900/50 dark:hover:text-white'} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm`}
            onClick={() => setIsOpen(false)}
          >
            Lessons
          </Link>
          <Link
            href="/react/interview"
            className={`${isActive('/react/interview') ? 'bg-blue-50/80 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-200' : 'border-transparent text-gray-600 hover:bg-blue-50/80 hover:border-gray-300 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-blue-900/50 dark:hover:text-white'} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm`}
            onClick={() => setIsOpen(false)}
          >
            Interview Quiz
          </Link>
          
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-4">Tailwind CSS</div>
          <Link
            href="/tailwind/lessons"
            className={`${isActive('/tailwind/lessons') ? 'bg-teal-50/80 dark:bg-teal-900/30 border-teal-500 text-teal-700 dark:text-teal-200' : 'border-transparent text-gray-600 hover:bg-gray-50/80 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white'} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm`}
            onClick={() => setIsOpen(false)}
          >
            Lessons
          </Link>
          <Link
            href="/tailwind/interview"
            className={`${isActive('/tailwind/interview') ? 'bg-teal-50/80 dark:bg-teal-900/30 border-teal-500 text-teal-700 dark:text-teal-200' : 'border-transparent text-gray-600 hover:bg-gray-50/80 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white'} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm`}
            onClick={() => setIsOpen(false)}
          >
            Interview Quiz
          </Link>
          
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-4">Node.js</div>
          <Link
            href="/node/lessons"
            className={`${isActive('/node/lessons') ? 'bg-green-50/80 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-200' : 'border-transparent text-gray-600 hover:bg-gray-50/80 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white'} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm`}
            onClick={() => setIsOpen(false)}
          >
            Lessons
          </Link>
          <Link
            href="/node/interview"
            className={`${isActive('/node/interview') ? 'bg-green-50/80 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-200' : 'border-transparent text-gray-600 hover:bg-gray-50/80 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white'} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm`}
            onClick={() => setIsOpen(false)}
          >
            Interview Quiz
          </Link>
          
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-4">SASS</div>
          <Link
            href="/sass/lessons"
            className={`${isActive('/sass/lessons') ? 'bg-pink-50/80 dark:bg-pink-900/30 border-pink-500 text-pink-700 dark:text-pink-200' : 'border-transparent text-gray-600 hover:bg-gray-50/80 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white'} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm`}
            onClick={() => setIsOpen(false)}
          >
            Lessons
          </Link>
          <Link
            href="/sass/interview"
            className={`${isActive('/sass/interview') ? 'bg-pink-50/80 dark:bg-pink-900/30 border-pink-500 text-pink-700 dark:text-pink-200' : 'border-transparent text-gray-600 hover:bg-gray-50/80 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white'} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm`}
            onClick={() => setIsOpen(false)}
          >
            Interview Quiz
          </Link>
          
          <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
          
          <Link
            href="/"
            className={`${isActive('/') ? 'bg-indigo-50/80 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-white' : 'border-transparent text-gray-600 hover:bg-gray-50/80 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm`}
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}