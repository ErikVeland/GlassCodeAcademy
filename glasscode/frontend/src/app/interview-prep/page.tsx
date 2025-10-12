'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import '../../styles/design-system.scss';

// Interview Preparation Hub - Non-Gamified Educational Structure
interface InterviewModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  questionCount: number;
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'general';
  technologies: string[];
  href: string;
  prerequisites: string[];
}

interface InterviewTier {
  title: string;
  description: string;
  color: string;
  modules: InterviewModule[];
  tierLevel: number;
  focusArea: string;
  learningObjectives: string[];
}

// Updated tier colors to match homepage
const interviewTiers: Record<string, InterviewTier> = {
  foundational: {
    title: 'Foundational Interview Prep',
    description: 'Master fundamental programming and web development interview questions',
    color: 'from-blue-500 to-cyan-500',
    tierLevel: 1,
    focusArea: 'Programming basics, web fundamentals, algorithms',
    learningObjectives: [
      'Master basic programming interview questions',
      'Understand fundamental web development concepts',
      'Practice algorithmic thinking and problem solving'
    ],
    modules: [
      {
        id: 'javascript-questions',
        title: 'JavaScript Fundamentals',
        description: 'ES6+, async/await, closures, prototypes, and core JavaScript concepts',
        icon: '📜',
        difficulty: 'Beginner',
        estimatedTime: '45-60 minutes',
        questionCount: 25,
        category: 'frontend',
        technologies: ['JavaScript', 'ES6+', 'Async/Await', 'DOM'],
        href: '/javascript/interview-questions',
        prerequisites: []
      },
      {
        id: 'sass-questions',
        title: 'CSS & SASS',
        description: 'Styling fundamentals, responsive design, and CSS preprocessors',
        icon: '🎨',
        difficulty: 'Beginner',
        estimatedTime: '30-45 minutes',
        questionCount: 18,
        category: 'frontend',
        technologies: ['CSS3', 'SASS', 'Responsive Design', 'Flexbox'],
        href: '/sass/interview-questions',
        prerequisites: []
      }
    ]
  },
  core: {
    title: 'Core Technology Interviews',
    description: 'Deep dive into major frameworks and backend technologies',
    color: 'from-green-500 to-emerald-500',
    tierLevel: 2,
    focusArea: 'Framework mastery, backend development, database design',
    learningObjectives: [
      'Master core framework interview questions',
      'Understand backend architecture patterns',
      'Design efficient database solutions'
    ],
    modules: [
      {
        id: 'react-questions',
        title: 'React Development',
        description: 'Components, hooks, state management, and modern React patterns',
        icon: '⚛️',
        difficulty: 'Intermediate',
        estimatedTime: '60-75 minutes',
        questionCount: 30,
        category: 'frontend',
        technologies: ['React', 'JSX', 'Hooks', 'Context API'],
        href: '/react/interview-questions',
        prerequisites: ['javascript-questions']
      },
      {
        id: 'dotnet-questions',
        title: '.NET Core & C#',
        description: 'C# language features, ASP.NET Core, Entity Framework, and enterprise patterns',
        icon: '⚡',
        difficulty: 'Intermediate',
        estimatedTime: '75-90 minutes',
        questionCount: 35,
        category: 'backend',
        technologies: ['C#', 'ASP.NET Core', 'Entity Framework', 'LINQ'],
        href: '/dotnet/interview-questions',
        prerequisites: ['javascript-questions']
      }
    ]
  },
  specialized: {
    title: 'Specialized Interview Topics',
    description: 'Advanced frameworks, modern development practices, and emerging technologies',
    color: 'from-purple-500 to-violet-500',
    tierLevel: 3,
    focusArea: 'Advanced frameworks, TypeScript, modern tooling',
    learningObjectives: [
      'Master advanced framework concepts',
      'Understand modern development tooling',
      'Implement complex architectural patterns'
    ],
    modules: [
      {
        id: 'typescript-questions',
        title: 'TypeScript',
        description: 'Type system, interfaces, generics, and advanced TypeScript patterns',
        icon: '📘',
        difficulty: 'Advanced',
        estimatedTime: '45-60 minutes',
        questionCount: 20,
        category: 'frontend',
        technologies: ['TypeScript', 'Generics', 'Interfaces', 'Type Guards'],
        href: '/typescript/interview-questions',
        prerequisites: ['react-questions']
      }
    ]
  },
  expert: {
    title: 'Expert-Level Challenges',
    description: 'System design, DevOps practices, and senior-level interview preparation',
    color: 'from-orange-500 to-red-500',
    tierLevel: 4,
    focusArea: 'System design, DevOps, architecture, senior-level concepts',
    learningObjectives: [
      'Design scalable system architectures',
      'Master DevOps and deployment strategies',
      'Lead technical discussions and decisions'
    ],
    modules: [
      {
        id: 'system-design-questions',
        title: 'System Design',
        description: 'Scalability, architecture patterns, microservices, and distributed systems',
        icon: '🏗️',
        difficulty: 'Advanced',
        estimatedTime: '120-180 minutes',
        questionCount: 15,
        category: 'general',
        technologies: ['Architecture', 'Scalability', 'Microservices', 'Load Balancing'],
        href: '/system-design/interview-questions',
        prerequisites: []
      }
    ]
  }
};

// Updated Interview Module Card Component with homepage styling
const InterviewModuleCard: React.FC<{
  module: InterviewModule;
  tierColor: string;
  tierKey: string;
}> = ({ module, tierColor, tierKey }) => {
  const prerequisitesMet = module.prerequisites.length === 0;
  const isLocked = module.prerequisites.length > 0 && !prerequisitesMet;

  // Define tier-specific gradient classes to match homepage
  const tierGradientClass = {
    foundational: 'from-blue-500 to-cyan-500',
    core: 'from-green-500 to-emerald-500',
    specialized: 'from-purple-500 to-violet-500',
    expert: 'from-orange-500 to-red-500'
  }[tierKey] || 'from-blue-500 to-cyan-500';

  return (
    <div className={`module-card-container ${isLocked ? 'locked' : ''}`}>
      <Link
        href={isLocked ? '#' : module.href}
        className={`block bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-xl transition-all duration-300 ${
          isLocked ? 'opacity-60' : 'hover:-translate-y-1'
        }`}
        aria-disabled={isLocked}
        role="article"
      >
        {isLocked && (
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm rounded-xl flex items-center justify-center z-5">
            <div className="text-center text-white">
              <div className="text-3xl mb-2">🔒</div>
              <p className="text-sm font-medium">Prerequisites Required</p>
            </div>
          </div>
        )}

        <div className="module-header flex items-start gap-4 mb-4">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tierGradientClass} flex items-center justify-center text-white font-bold text-lg`}>
            {module.icon}
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 text-left">
              {module.title}
            </h4>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                module.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-700 dark:text-green-300' :
                module.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300' :
                'bg-red-500/20 text-red-700 dark:text-red-300'
              }`}>
                {module.difficulty}
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-700 dark:text-gray-300">
                {module.questionCount} questions
              </span>
            </div>
          </div>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-4 text-left text-sm">
          {module.description}
        </p>

        {/* Technologies used - Pill-shaped tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {module.technologies.slice(0, 3).map(tech => (
            <span key={tech} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs">
              {tech}
            </span>
          ))}
          {module.technologies.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs">+{module.technologies.length - 3} more</span>
          )}
        </div>

        <div className="module-meta mt-auto">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>⏱️ {module.estimatedTime}</span>
            <span className="capitalize">{module.category}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

// Updated Tier Section Component with homepage styling
const InterviewTierSection: React.FC<{
  tier: InterviewTier;
  tierKey: string;
  isVisible: boolean;
}> = ({ tier, tierKey, isVisible }) => {
  if (!isVisible) return null;

  const totalQuestions = tier.modules.reduce((sum, module) => sum + module.questionCount, 0);

  // Define tier-specific gradient classes to match homepage
  const tierGradientClass = {
    foundational: 'from-blue-500 to-cyan-500',
    core: 'from-green-500 to-emerald-500',
    specialized: 'from-purple-500 to-violet-500',
    expert: 'from-orange-500 to-red-500'
  }[tierKey] || 'from-blue-500 to-cyan-500';

  return (
    <section className="w-full mb-8" data-tier={tierKey}>
      <div className={`rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br ${tierGradientClass} p-6`}>
        <div className="tier-header mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg backdrop-blur-sm`}>
                  {tier.tierLevel}
                </div>
                <div className="text-left">
                  <h2 className="text-xl md:text-2xl font-bold text-white text-left">
                    {tier.title}
                  </h2>
                  <p className="text-white/90 mt-1 text-left text-sm">{tier.description}</p>
                </div>
              </div>

              <div className="bg-white/10 rounded-lg p-4 border border-white/20 backdrop-blur-sm">
                <p className="font-medium text-white text-left text-sm">
                  <strong>Focus Area:</strong> {tier.focusArea}
                </p>
              </div>
            </div>

            {/* Unified progress widget like dashboard */}
            <div className="bg-white/20 text-white p-4 rounded-lg min-w-[140px] text-center backdrop-blur-sm">
              <div className="text-2xl font-bold">{tier.modules.length}</div>
              <div className="text-sm opacity-90">Modules</div>
              <div className="text-xs opacity-80 mt-1">
                {totalQuestions} questions
              </div>
            </div>
          </div>

          {/* Learning objectives */}
          <div className="bg-white/10 rounded-xl p-5 border border-white/20 mt-4 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-3 text-left">Learning Objectives</h3>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {tier.learningObjectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-white mt-1 flex-shrink-0 text-sm">✓</span>
                  <span className="text-white/90 text-left text-sm">{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modules grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6" role="list">
          {tier.modules.map((module: InterviewModule) => (
            <div key={module.id} role="listitem">
              <InterviewModuleCard
                module={module}
                tierColor={tier.color}
                tierKey={tierKey}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const InterviewPrepPage: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tiers based on selected filters
  const filteredTiers = Object.entries(interviewTiers).reduce((acc, [tierKey, tier]) => {
    let filteredModules = tier.modules;

    if (searchQuery) {
      filteredModules = filteredModules.filter(module =>
        module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.technologies.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedTier && selectedTier !== 'all' && selectedTier !== tierKey) {
      filteredModules = [];
    }

    if (selectedDifficulty && selectedDifficulty !== 'all') {
      filteredModules = filteredModules.filter(module =>
        module.difficulty.toLowerCase() === selectedDifficulty.toLowerCase()
      );
    }

    if (selectedCategory && selectedCategory !== 'all') {
      filteredModules = filteredModules.filter(module =>
        module.category === selectedCategory
      );
    }

    if (filteredModules.length > 0) {
      acc[tierKey] = { ...tier, modules: filteredModules };
    }

    return acc;
  }, {} as Record<string, InterviewTier>);

  const totalModules = Object.values(interviewTiers).reduce((sum, tier) => sum + tier.modules.length, 0);
  const totalQuestions = Object.values(interviewTiers).reduce((sum, tier) =>
    sum + tier.modules.reduce((tierSum, module) => tierSum + module.questionCount, 0), 0
  );

  const hasActiveFilters = searchQuery || selectedTier || selectedDifficulty || selectedCategory;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTier(null);
    setSelectedDifficulty(null);
    setSelectedCategory(null);
  };

  return (
    <div className="liquid-glass-layout">
      <main className="homepage w-full">
        {/* Hero Section with proper styling like the dashboard */}
        <section className="w-full mb-8">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="hero-content">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-left">
                    Interview Preparation Academy
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 text-left">
                    Master Technical Interviews with Structured Learning
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-left">
                    Prepare systematically for technical interviews through our tier-based approach.
                    From foundational concepts to expert-level system design, build confidence with
                    comprehensive question banks and detailed explanations.
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-lg text-center">
                      <div className="text-sm opacity-90">Modules</div>
                      <div className="text-2xl font-bold">{totalModules}</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-lg text-center">
                      <div className="text-sm opacity-90">Questions</div>
                      <div className="text-2xl font-bold">{totalQuestions}</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-violet-500 text-white p-4 rounded-lg text-center">
                      <div className="text-sm opacity-90">Tiers</div>
                      <div className="text-2xl font-bold">4</div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-lg text-center">
                      <div className="text-sm opacity-90">Categories</div>
                      <div className="text-2xl font-bold">5</div>
                    </div>
                  </div>
                </div>

                <div className="hero-visual flex justify-center">
                  <div className="interview-path-visualization w-full max-w-md">
                    <svg viewBox="0 0 400 300" className="path-svg w-full h-auto">
                      <defs>
                        <linearGradient id="interviewPathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="25%" stopColor="#10B981" />
                          <stop offset="50%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#F59E0B" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M50,250 Q150,200 200,150 T350,50"
                        stroke="url(#interviewPathGradient)"
                        strokeWidth="6"
                        fill="none"
                        className="learning-path"
                      />
                      <circle cx="50" cy="250" r="12" fill="#3B82F6" className="tier-node" />
                      <circle cx="150" cy="190" r="12" fill="#10B981" className="tier-node" />
                      <circle cx="250" cy="110" r="12" fill="#8B5CF6" className="tier-node" />
                      <circle cx="350" cy="50" r="12" fill="#F59E0B" className="tier-node" />
                      <text x="50" y="275" textAnchor="middle" fill="white" fontSize="12">Foundational</text>
                      <text x="150" y="215" textAnchor="middle" fill="white" fontSize="12">Core</text>
                      <text x="250" y="135" textAnchor="middle" fill="white" fontSize="12">Specialized</text>
                      <text x="350" y="75" textAnchor="middle" fill="white" fontSize="12">Expert</text>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filter System */}
        <section className="w-full mb-8">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="search-container mb-4">
                <div className="search-input-wrapper relative">
                  <input
                    type="text"
                    placeholder="Search interview topics, technologies, or modules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-3 text-gray-400">🔍</span>
                </div>
              </div>

              <div className="filters-container grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="filter-group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tier Level</label>
                  <select
                    value={selectedTier || 'all'}
                    onChange={(e) => setSelectedTier(e.target.value === 'all' ? null : e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Tiers</option>
                    <option value="foundational">🏗️ Foundational</option>
                    <option value="core">⚙️ Core Technologies</option>
                    <option value="specialized">💎 Specialized Skills</option>
                    <option value="expert">🏆 Expert Level</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
                  <select
                    value={selectedDifficulty || 'all'}
                    onChange={(e) => setSelectedDifficulty(e.target.value === 'all' ? null : e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Levels</option>
                    <option value="Beginner">🌱 Beginner</option>
                    <option value="Intermediate">🚀 Intermediate</option>
                    <option value="Advanced">🔥 Advanced</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={selectedCategory || 'all'}
                    onChange={(e) => setSelectedCategory(e.target.value === 'all' ? null : e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Categories</option>
                    <option value="frontend">🎨 Frontend</option>
                    <option value="backend">🔧 Backend</option>
                    <option value="database">🗄️ Database</option>
                    <option value="devops">☁️ DevOps</option>
                    <option value="general">📁 General</option>
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="filter-results mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {Object.values(filteredTiers).reduce((sum, tier) => sum + tier.modules.length, 0)} of {totalModules} modules
                  </span>
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Interview Preparation Tiers */}
        <div id="interview-tiers" className="w-full">
          {hasActiveFilters && Object.keys(filteredTiers).length === 0 && (
            <div className="py-12 text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="max-w-3xl mx-auto">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No modules found</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}

          {Object.entries(filteredTiers).map(([tierKey, tier]) => (
            <InterviewTierSection
              key={tierKey}
              tier={tier}
              tierKey={tierKey}
              isVisible={!hasActiveFilters || tier.modules.length > 0}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <section className="w-full py-8">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/" className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 text-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <span className="text-4xl block mb-2">🎓</span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Learning Modules</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Return to main learning curriculum and lessons</p>
                </Link>

                <Link href="/playground" className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 text-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <span className="text-4xl block mb-2">🔬</span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">GraphQL Playground</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Practice with interactive GraphQL queries</p>
                </Link>

                <Link href="/animated-background-demo" className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 text-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <span className="text-4xl block mb-2">🎨</span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Design Showcase</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Explore our UI components and animations</p>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default InterviewPrepPage;
