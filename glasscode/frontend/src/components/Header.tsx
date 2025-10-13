'use client'

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import MobileMenu from './MobileMenu';
import DarkModeToggle from './DarkModeToggle';
import ProfileMenu from './ProfileMenu';
import { useProgressTracking } from '../hooks/useProgressTracking';
import { contentRegistry } from '@/lib/contentRegistry';

interface NavigationModule {
  id: string;
  title: string;
  lessonsPath: string;
  quizPath: string;
  progress: number;
  tier: 'foundational' | 'core' | 'specialized' | 'quality';
  category: 'backend' | 'frontend' | 'quality';
  icon: string;
  estimatedTime: string;
}

interface TierGroup {
  tier: 'foundational' | 'core' | 'specialized' | 'quality';
  title: string;
  description: string;
  color: string;
  icon: string;
  modules: NavigationModule[];
}

export default function Header() {
  const [isFoundationalOpen, setIsFoundationalOpen] = useState(false);
  const [isCoreOpen, setIsCoreOpen] = useState(false);
  const [isSpecializedOpen, setIsSpecializedOpen] = useState(false);
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [tierGroups, setTierGroups] = useState<Record<string, TierGroup> | null>(null);
  const foundationalRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const specializedRef = useRef<HTMLDivElement>(null);
  const qualityRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { getTierProgress } = useProgressTracking();

  // Load registry data on component mount
  useEffect(() => {
    const loadRegistryData = async () => {
      try {
        await contentRegistry.loadRegistry();
        const modules = await contentRegistry.getModules();
        
        // Create tier groups with actual module data from registry
        const tierGroupsData: Record<string, TierGroup> = {
          foundational: {
            tier: 'foundational',
            title: 'Foundational',
            description: 'Build essential programming skills',
            color: 'from-blue-500 to-cyan-500',
            icon: '🏗️',
            modules: modules
              .filter(module => module.tier === 'foundational')
              .map(module => ({
                id: module.slug,
                title: module.title,
                lessonsPath: module.routes.lessons,
                quizPath: module.routes.quiz,
                progress: 0,
                tier: 'foundational' as const,
                category: module.track.toLowerCase() as 'backend' | 'frontend' | 'quality',
                icon: module.icon,
                estimatedTime: `${module.estimatedHours} hours`
              }))
          },
          core: {
            tier: 'core',
            title: 'Core Technologies',
            description: 'Master primary development technologies',
            color: 'from-green-500 to-emerald-500',
            icon: '⚙️',
            modules: modules
              .filter(module => module.tier === 'core')
              .map(module => ({
                id: module.slug,
                title: module.title,
                lessonsPath: module.routes.lessons,
                quizPath: module.routes.quiz,
                progress: 0,
                tier: 'core' as const,
                category: module.track.toLowerCase() as 'backend' | 'frontend' | 'quality',
                icon: module.icon,
                estimatedTime: `${module.estimatedHours} hours`
              }))
          },
          specialized: {
            tier: 'specialized',
            title: 'Specialized Skills',
            description: 'Advanced frameworks and modern practices',
            color: 'from-purple-500 to-violet-500',
            icon: '💎',
            modules: modules
              .filter(module => module.tier === 'specialized')
              .map(module => ({
                id: module.slug,
                title: module.title,
                lessonsPath: module.routes.lessons,
                quizPath: module.routes.quiz,
                progress: 0,
                tier: 'specialized' as const,
                category: module.track.toLowerCase() as 'backend' | 'frontend' | 'quality',
                icon: module.icon,
                estimatedTime: `${module.estimatedHours} hours`
              }))
          },
          quality: {
            tier: 'quality',
            title: 'Quality & Testing',
            description: 'Professional quality assurance',
            color: 'from-orange-500 to-red-500',
            icon: '🛡️',
            modules: modules
              .filter(module => module.tier === 'quality')
              .map(module => ({
                id: module.slug,
                title: module.title,
                lessonsPath: module.routes.lessons,
                quizPath: module.routes.quiz,
                progress: 0,
                tier: 'quality' as const,
                category: module.track.toLowerCase() as 'backend' | 'frontend' | 'quality',
                icon: module.icon,
                estimatedTime: `${module.estimatedHours} hours`
              }))
          }
        };
        
        setTierGroups(tierGroupsData);
      } catch (error) {
        console.error('Failed to load registry data:', error);
        // Fallback to hardcoded data if registry fails to load
        setTierGroups({
          foundational: {
            tier: 'foundational',
            title: 'Foundational',
            description: 'Build essential programming skills',
            color: 'from-blue-500 to-cyan-500',
            icon: '🏗️',
            modules: [
              { id: 'programming-basics', title: 'Programming Fundamentals', lessonsPath: '/programming/lessons', quizPath: '/programming/interview', progress: 0, tier: 'foundational', category: 'backend', icon: '💻', estimatedTime: '40 hours' },
              { id: 'web-fundamentals', title: 'Web Development Basics', lessonsPath: '/web/lessons', quizPath: '/web/interview', progress: 0, tier: 'foundational', category: 'frontend', icon: '🌐', estimatedTime: '50 hours' },
              { id: 'version-control', title: 'Version Control with Git', lessonsPath: '/version/lessons', quizPath: '/version/interview', progress: 0, tier: 'foundational', category: 'backend', icon: '📝', estimatedTime: '20 hours' }
            ]
          },
          core: {
            tier: 'core',
            title: 'Core Technologies',
            description: 'Master primary development technologies',
            color: 'from-green-500 to-emerald-500',
            icon: '⚙️',
            modules: [
              { id: 'dotnet', title: '.NET Core', lessonsPath: '/dotnet/lessons', quizPath: '/dotnet/interview', progress: 0, tier: 'core', category: 'backend', icon: '⚡', estimatedTime: '80 hours' },
              { id: 'laravel', title: 'Laravel', lessonsPath: '/modules/laravel-fundamentals/lessons', quizPath: '/modules/laravel-fundamentals/quiz', progress: 0, tier: 'core', category: 'backend', icon: '🎨', estimatedTime: '70 hours' },
              { id: 'react', title: 'React', lessonsPath: '/modules/react-fundamentals/lessons', quizPath: '/modules/react-fundamentals/quiz', progress: 0, tier: 'core', category: 'frontend', icon: '⚛️', estimatedTime: '60 hours' },
              { id: 'database', title: 'Databases', lessonsPath: '/modules/database-systems/lessons', quizPath: '/modules/database-systems/quiz', progress: 0, tier: 'core', category: 'backend', icon: '🗄️', estimatedTime: '70 hours' }
            ]
          },
          specialized: {
            tier: 'specialized',
            title: 'Specialized Skills',
            description: 'Advanced frameworks and modern practices',
            color: 'from-purple-500 to-violet-500',
            icon: '💎',
            modules: [
              { id: 'nextjs', title: 'Next.js', lessonsPath: '/modules/nextjs-advanced/lessons', quizPath: '/modules/nextjs-advanced/quiz', progress: 0, tier: 'specialized', category: 'frontend', icon: '⭐', estimatedTime: '50 hours' },
              { id: 'graphql', title: 'GraphQL', lessonsPath: '/modules/graphql-advanced/lessons', quizPath: '/modules/graphql-advanced/quiz', progress: 0, tier: 'specialized', category: 'backend', icon: '🔗', estimatedTime: '50 hours' },
              { id: 'node', title: 'Node.js', lessonsPath: '/modules/node-fundamentals/lessons', quizPath: '/modules/node-fundamentals/quiz', progress: 0, tier: 'specialized', category: 'backend', icon: '💚', estimatedTime: '60 hours' },
              { id: 'typescript', title: 'TypeScript', lessonsPath: '/modules/typescript-fundamentals/lessons', quizPath: '/modules/typescript-fundamentals/quiz', progress: 0, tier: 'specialized', category: 'frontend', icon: '🔵', estimatedTime: '50 hours' },
              { id: 'tailwind', title: 'Tailwind CSS', lessonsPath: '/modules/tailwind-advanced/lessons', quizPath: '/modules/tailwind-advanced/quiz', progress: 0, tier: 'specialized', category: 'frontend', icon: '🎨', estimatedTime: '35 hours' },
              { id: 'sass', title: 'SASS', lessonsPath: '/modules/sass-advanced/lessons', quizPath: '/modules/sass-advanced/quiz', progress: 0, tier: 'specialized', category: 'frontend', icon: '🎨', estimatedTime: '35 hours' }
            ]
          },
          quality: {
            tier: 'quality',
            title: 'Quality & Testing',
            description: 'Professional quality assurance',
            color: 'from-orange-500 to-red-500',
            icon: '🛡️',
            modules: [
              { id: 'testing', title: 'Testing & QA', lessonsPath: '/modules/testing-fundamentals/lessons', quizPath: '/modules/testing-fundamentals/quiz', progress: 0, tier: 'quality', category: 'quality', icon: '🧪', estimatedTime: '50 hours' }
            ]
          }
        });
      }
    };

    loadRegistryData();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (foundationalRef.current && !foundationalRef.current.contains(event.target as Node)) {
        setIsFoundationalOpen(false);
      }
      if (coreRef.current && !coreRef.current.contains(event.target as Node)) {
        setIsCoreOpen(false);
      }
      if (specializedRef.current && !specializedRef.current.contains(event.target as Node)) {
        setIsSpecializedOpen(false);
      }
      if (qualityRef.current && !qualityRef.current.contains(event.target as Node)) {
        setIsQualityOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeTierDropdowns();
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const closeTierDropdowns = () => {
    setIsFoundationalOpen(false);
    setIsCoreOpen(false);
    setIsSpecializedOpen(false);
    setIsQualityOpen(false);
  };

  const handleDropdownToggle = (tier: string) => {
    closeTierDropdowns();
    setActiveDropdown(tier === activeDropdown ? null : tier);
    
    switch (tier) {
      case 'foundational':
        setIsFoundationalOpen(tier !== activeDropdown);
        break;
      case 'core':
        setIsCoreOpen(tier !== activeDropdown);
        break;
      case 'specialized':
        setIsSpecializedOpen(tier !== activeDropdown);
        break;
      case 'quality':
        setIsQualityOpen(tier !== activeDropdown);
        break;
    }
  };

  const handleDropdownKeyDown = (event: React.KeyboardEvent, tier: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleDropdownToggle(tier);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      handleDropdownToggle(tier);
      // Focus first menu item when dropdown opens
      setTimeout(() => {
        const dropdown = document.querySelector(`[data-tier="${tier}"] [role="menuitem"]`) as HTMLElement;
        dropdown?.focus();
      }, 0);
    }
  };

  // Show loading state while registry data is loading
  if (!tierGroups) {
    return (
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow dark:shadow-gray-700 w-full border-b border-gray-200 dark:border-gray-700 relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link 
                href="/" 
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-label="GlassCode Academy Home"
              >
                GlassCode Academy
              </Link>
            </div>
            
            {/* Loading placeholder for desktop menu */}
            <div className="hidden md:flex md:items-center md:space-x-6">
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            
            <div className="flex items-center">
              <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              <div className="md:hidden ml-2">
                <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow dark:shadow-gray-700 w-full border-b border-gray-200 dark:border-gray-700 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link 
              href="/" 
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="GlassCode Academy Home"
            >
              GlassCode Academy
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {/* Foundational Tier Dropdown */}
            <div className="relative" ref={foundationalRef} data-tier="foundational">
              <button
                onClick={() => handleDropdownToggle('foundational')}
                onKeyDown={(e) => handleDropdownKeyDown(e, 'foundational')}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFoundationalOpen 
                    ? 'bg-blue-100/80 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 backdrop-blur-sm' 
                    : 'text-gray-700 hover:bg-blue-100/80 dark:text-gray-300 dark:hover:bg-blue-900/50 hover:text-blue-700 dark:hover:text-blue-200'
                }`}
                aria-haspopup="true"
                aria-expanded={isFoundationalOpen}
                aria-label="Foundational skills menu"
                id="foundational-menu-button"
              >
                🏗️ Foundational
                <div className="ml-1 flex items-center">
                  <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full mr-1">
                    {getTierProgress('foundational')}%
                  </span>
                  <svg className={`h-4 w-4 transition-transform duration-200 ${isFoundationalOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
              
              {isFoundationalOpen && (
                <div 
                  className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-lg bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm ring-1 ring-black ring-opacity-5 z-[9999] border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="foundational-menu-button"
                >
                  <div className="py-2 px-4">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                      🏗️ {tierGroups.foundational.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                      {tierGroups.foundational.description}
                    </div>
                    {tierGroups.foundational.modules.map(module => (
                      <div key={module.id} className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm flex items-center">
                            <span className="mr-2">{module.icon}</span>
                            {module.title}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {module.estimatedTime}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={module.lessonsPath}
                            className={`${
                              isActive(module.lessonsPath) 
                                ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200' 
                                : 'text-gray-700 hover:bg-blue-50/80 dark:text-gray-300 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-200'
                            } block px-3 py-2 text-xs font-medium transition-colors duration-150 backdrop-blur-sm rounded flex-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            role="menuitem"
                            onClick={closeTierDropdowns}
                            tabIndex={isFoundationalOpen ? 0 : -1}
                          >
                            📚 Lessons
                          </Link>
                          <Link
                            href={module.quizPath}
                            className={`${
                              isActive(module.quizPath) 
                                ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200' 
                                : 'text-gray-700 hover:bg-blue-50/80 dark:text-gray-300 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-200'
                            } block px-3 py-2 text-xs font-medium transition-colors duration-150 backdrop-blur-sm rounded flex-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            role="menuitem"
                            onClick={closeTierDropdowns}
                            tabIndex={isFoundationalOpen ? 0 : -1}
                          >
                            🎯 Quiz
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Core Tier Dropdown */}
            <div className="relative" ref={coreRef}>
              <button
                onClick={() => {
                  setIsCoreOpen(!isCoreOpen);
                  setIsFoundationalOpen(false);
                  setIsSpecializedOpen(false);
                  setIsQualityOpen(false);
                }}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  isCoreOpen 
                    ? 'bg-green-100/80 dark:bg-green-900/50 text-green-700 dark:text-green-200 backdrop-blur-sm' 
                    : 'text-gray-700 hover:bg-green-100/80 dark:text-gray-300 dark:hover:bg-green-900/50 hover:text-green-700 dark:hover:text-green-200'
                }`}
                aria-haspopup="true"
                aria-expanded={isCoreOpen}
                aria-label="Core technologies menu"
              >
                ⚙️ Core
                <div className="ml-1 flex items-center">
                  <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full mr-1">
                    {getTierProgress('core')}%
                  </span>
                  <svg className={`h-4 w-4 transition-transform duration-200 ${isCoreOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
              
              {isCoreOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-lg bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm ring-1 ring-black ring-opacity-5 z-[9999] border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                  <div className="py-2 px-4" role="menu">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                      ⚙️ {tierGroups.core.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                      {tierGroups.core.description}
                    </div>
                    {tierGroups.core.modules.map(module => (
                      <div key={module.id} className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm flex items-center">
                            <span className="mr-2">{module.icon}</span>
                            {module.title}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {module.estimatedTime}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={module.lessonsPath}
                            className={`${
                              isActive(module.lessonsPath) 
                                ? 'bg-green-50/80 dark:bg-green-900/30 text-green-700 dark:text-green-200' 
                                : 'text-gray-700 hover:bg-green-50/80 dark:text-gray-300 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-200'
                            } block px-3 py-2 text-xs font-medium transition-colors duration-150 backdrop-blur-sm rounded flex-1 text-center`}
                            role="menuitem"
                            onClick={closeTierDropdowns}
                          >
                            📚 Lessons
                          </Link>
                          <Link
                            href={module.quizPath}
                            className={`${
                              isActive(module.quizPath) 
                                ? 'bg-green-50/80 dark:bg-green-900/30 text-green-700 dark:text-green-200' 
                                : 'text-gray-700 hover:bg-green-50/80 dark:text-gray-300 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-200'
                            } block px-3 py-2 text-xs font-medium transition-colors duration-150 backdrop-blur-sm rounded flex-1 text-center`}
                            role="menuitem"
                            onClick={closeTierDropdowns}
                          >
                            🎯 Quiz
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            
            {/* Specialized Tier Dropdown */}
            <div className="relative" ref={specializedRef}>
              <button
                onClick={() => {
                  setIsSpecializedOpen(!isSpecializedOpen);
                  setIsFoundationalOpen(false);
                  setIsCoreOpen(false);
                  setIsQualityOpen(false);
                }}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isSpecializedOpen 
                    ? 'bg-purple-100/80 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200 backdrop-blur-sm' 
                    : 'text-gray-700 hover:bg-purple-100/80 dark:text-gray-300 dark:hover:bg-purple-900/50 hover:text-purple-700 dark:hover:text-purple-200'
                }`}
                aria-haspopup="true"
                aria-expanded={isSpecializedOpen}
                aria-label="Specialized skills menu"
              >
                📎 Specialized
                <div className="ml-1 flex items-center">
                  <span className="text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded-full mr-1">
                    {getTierProgress('specialized')}%
                  </span>
                  <svg className={`h-4 w-4 transition-transform duration-200 ${isSpecializedOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
              
              {isSpecializedOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-96 rounded-xl shadow-lg bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm ring-1 ring-black ring-opacity-5 z-[9999] border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                  <div className="py-2 px-4" role="menu">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                      📎 {tierGroups.specialized.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                      {tierGroups.specialized.description}
                    </div>
                    {tierGroups.specialized.modules.map(module => (
                      <div key={module.id} className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm flex items-center">
                            <span className="mr-2">{module.icon}</span>
                            {module.title}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {module.estimatedTime}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={module.lessonsPath}
                            className={`${
                              isActive(module.lessonsPath) 
                                ? 'bg-purple-50/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200' 
                                : 'text-gray-700 hover:bg-purple-50/80 dark:text-gray-300 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-200'
                            } block px-3 py-2 text-xs font-medium transition-colors duration-150 backdrop-blur-sm rounded flex-1 text-center`}
                            role="menuitem"
                            onClick={closeTierDropdowns}
                          >
                            📚 Lessons
                          </Link>
                          <Link
                            href={module.quizPath}
                            className={`${
                              isActive(module.quizPath) 
                                ? 'bg-purple-50/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200' 
                                : 'text-gray-700 hover:bg-purple-50/80 dark:text-gray-300 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-200'
                            } block px-3 py-2 text-xs font-medium transition-colors duration-150 backdrop-blur-sm rounded flex-1 text-center`}
                            role="menuitem"
                            onClick={closeTierDropdowns}
                          >
                            🎯 Quiz
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Quality Tier Dropdown */}
            <div className="relative" ref={qualityRef}>
              <button
                onClick={() => {
                  setIsQualityOpen(!isQualityOpen);
                  setIsFoundationalOpen(false);
                  setIsCoreOpen(false);
                  setIsSpecializedOpen(false);
                }}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  isQualityOpen 
                    ? 'bg-orange-100/80 dark:bg-orange-900/50 text-orange-700 dark:text-orange-200 backdrop-blur-sm' 
                    : 'text-gray-700 hover:bg-orange-100/80 dark:text-gray-300 dark:hover:bg-orange-900/50 hover:text-orange-700 dark:hover:text-orange-200'
                }`}
                aria-haspopup="true"
                aria-expanded={isQualityOpen}
                aria-label="Quality and testing menu"
              >
                🛡️ Quality
                <div className="ml-1 flex items-center">
                  <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full mr-1">
                    {getTierProgress('quality')}%
                  </span>
                  <svg className={`h-4 w-4 transition-transform duration-200 ${isQualityOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
              
              {isQualityOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-lg bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm ring-1 ring-black ring-opacity-5 z-[9999] border border-gray-200 dark:border-gray-700">
                  <div className="py-2 px-4" role="menu">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                      🛡️ {tierGroups.quality.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                      {tierGroups.quality.description}
                    </div>
                    {tierGroups.quality.modules.map(module => (
                      <div key={module.id} className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm flex items-center">
                            <span className="mr-2">{module.icon}</span>
                            {module.title}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {module.estimatedTime}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={module.lessonsPath}
                            className={`${
                              isActive(module.lessonsPath) 
                                ? 'bg-orange-50/80 dark:bg-orange-900/30 text-orange-700 dark:text-orange-200' 
                                : 'text-gray-700 hover:bg-orange-50/80 dark:text-gray-300 dark:hover:bg-orange-900/30 hover:text-orange-700 dark:hover:text-orange-200'
                            } block px-3 py-2 text-xs font-medium transition-colors duration-150 backdrop-blur-sm rounded flex-1 text-center`}
                            role="menuitem"
                            onClick={closeTierDropdowns}
                          >
                            📚 Lessons
                          </Link>
                          <Link
                            href={module.quizPath}
                            className={`${
                              isActive(module.quizPath) 
                                ? 'bg-orange-50/80 dark:bg-orange-900/30 text-orange-700 dark:text-orange-200' 
                                : 'text-gray-700 hover:bg-orange-50/80 dark:text-gray-300 dark:hover:bg-orange-900/30 hover:text-orange-700 dark:hover:text-orange-200'
                            } block px-3 py-2 text-xs font-medium transition-colors duration-150 backdrop-blur-sm rounded flex-1 text-center`}
                            role="menuitem"
                            onClick={closeTierDropdowns}
                          >
                            🎯 Quiz
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Playground Link */}
            <Link 
              href="/playground" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center ${
                isActive('/playground') 
                  ? 'bg-gray-100/80 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                  : 'text-gray-700 hover:bg-gray-100/80 dark:text-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              aria-label="GraphQL Playground"
            >
              🎮 Playground
            </Link>
          </div>
          
          <div className="flex items-center">
            {/* DarkModeToggle moved to floating bottom-right. Space reserved for upcoming Profile menu. */}
            <div className="hidden md:block mr-2">
              <ProfileMenu />
            </div>
            <div className="md:hidden ml-2">
              <MobileMenu />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}