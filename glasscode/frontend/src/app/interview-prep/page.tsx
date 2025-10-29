'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import '../../styles/design-system.scss';
import '../../styles/homepage.scss';
import { useProgressTracking, ProgressData } from '../../hooks/useProgressTracking';
import { ChartBarIcon, LockClosedIcon } from '@heroicons/react/24/outline';

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
  tierKey: string;
  isLocked: boolean;
}> = ({ module, tierKey, isLocked }) => {
  const tierVariantClass = (
    tierKey === 'expert' ? 'tier-quality' :
    tierKey === 'foundational' ? 'tier-foundational' :
    tierKey === 'core' ? 'tier-core' :
    tierKey === 'specialized' ? 'tier-specialized' : ''
  );

  const iconTierClass = (
    tierKey === 'expert' ? 'glass-tier-quality' :
    tierKey === 'foundational' ? 'glass-tier-foundational' :
    tierKey === 'core' ? 'glass-tier-core' :
    tierKey === 'specialized' ? 'glass-tier-specialized' : ''
  );

  const categoryLabel = module.category.charAt(0).toUpperCase() + module.category.slice(1);

  return (
    <div className={`module-card-container ${isLocked ? 'locked' : ''}`}>
      <Link
        href={isLocked ? '#' : module.href}
        aria-label={module.title}
        role="link"
        title={module.title}
        className={`glass-module-card ${tierVariantClass} group relative ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1 hover:shadow-xl active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ring-focus ring-offset-bg'} rounded-xl overflow-hidden`}
        aria-disabled={isLocked}
      >
        {/* Lock overlay */}
        {isLocked && (
          <div className="absolute inset-0 backdrop-blur-sm rounded-xl flex items-center justify-center z-10" style={{ backgroundColor: 'hsl(var(--bg) / 0.5)' }}>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center border border-border shadow-lg mx-auto" style={{ backgroundColor: 'hsl(var(--bg) / 0.3)' }}>
                <span className="text-3xl">🔒</span>
              </div>
              <p className="mt-2 text-primary-fg text-sm">Complete prerequisites to unlock</p>
            </div>
          </div>
        )}

        {/* Icon and header */}
        <div className={`glass-morphism ${iconTierClass} rounded-t-xl p-4 flex items-center gap-3`}>
          <div className="text-3xl md:text-4xl leading-none" aria-hidden="true">{module.icon}</div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-fg truncate leading-tight">{module.title}</h3>
            <p className="text-muted text-sm truncate leading-tight">{categoryLabel}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <p id={`module-${module.id}-description`} className="text-sm text-muted text-left">{module.description}</p>
          {/* Prerequisites pills */}
          {module.prerequisites && module.prerequisites.length > 0 && (
            <div className="mt-3 text-left space-y-1">
              <div className="text-xs text-muted mb-1.5">Requires:</div>
              <div className="flex flex-wrap gap-2">
                {module.prerequisites.map((p) => (
                  <span key={p} className="unlock-chip">{p}</span>
                ))}
              </div>
            </div>
          )}
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
  lockEnabled?: boolean;
  progress?: Record<string, ProgressData>;
}> = ({ tier, tierKey, isVisible, lockEnabled = true, progress = {} }) => {
  if (!isVisible) return null;

  return (
    <section className="tier-section w-full mb-8" data-tier={tierKey === 'expert' ? 'quality' : tierKey}>
      <div className={`tier-container bg-gradient-to-r ${tier.color}`}>
        <div className="tier-header mb-6">
          <div className="flex items-stretch gap-4 mb-4">
            <div className="self-stretch flex items-center">
              <div className="w-14 aspect-square flex-shrink-0 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-2xl backdrop-blur-sm">
                {tier.tierLevel}
              </div>
            </div>
            <div className="text-left min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-white truncate">
                {tier.title}
              </h2>
              <p className="text-white/90 mt-1 text-left text-sm">
                {tier.description}
              </p>
            </div>
          </div>

          <div className="md:flex-none md:w-[320px] grid grid-cols-1 gap-3">
            <div className="glass-morphism rounded-lg p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-white/80 text-left mb-1">Focus Area</h3>
              <p className="text-xs text-white/90 text-left">{tier.focusArea}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 auto-rows-fr" role="list" aria-label={`${tier.title} modules`}>
          {tier.modules.map((module: InterviewModule) => {
            const prereqs = module.prerequisites || [];
            const prerequisitesMet = prereqs.length === 0 || prereqs.every(slug => {
              const moduleSlug = INTERVIEW_TO_MODULE_SLUG_MAP[slug] || slug;
              const p = progress[moduleSlug];
              return p && p.completionStatus === 'completed';
            });
            const isLocked = !!lockEnabled && prereqs.length > 0 && !prerequisitesMet;

            return (
              <div key={module.id} role="listitem" className="h-full">
                <InterviewModuleCard module={module} tierKey={tierKey} isLocked={isLocked} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const INTERVIEW_TO_MODULE_SLUG_MAP: Record<string, string> = {
  'javascript-questions': 'web-fundamentals',
  'sass-questions': 'sass-advanced',
  'react-questions': 'react-fundamentals',
  'dotnet-questions': 'dotnet-fundamentals',
  'typescript-questions': 'typescript-fundamentals',
  'system-design-questions': 'system-design-fundamentals',
};

const InterviewPrepPage: React.FC = () => {
  const { progress } = useProgressTracking();
  const [moduleLockEnabled, setModuleLockEnabled] = React.useState<boolean>(true);

  React.useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('gc.moduleLockEnabled') : null;
      if (stored !== null) setModuleLockEnabled(stored === 'true');
    } catch {
      // ignore
    }
  }, []);

  const toggleModuleLock = React.useCallback(() => {
    setModuleLockEnabled((prev) => {
      const next = !prev;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('gc.moduleLockEnabled', String(next));
        }
      } catch {}
      return next;
    });
  }, []);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { exportProgressData } = useProgressTracking();

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
          <div className="relative bg-surface-alt backdrop-blur-sm rounded-xl shadow-lg border border-border">

            <div className="absolute top-6 right-6 md:top-8 md:right-8">
              <button
                type="button"
                onClick={toggleModuleLock}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border bg-surface-alt border-border text-muted hover:brightness-105 transition-colors"
                aria-pressed={moduleLockEnabled}
                aria-label={moduleLockEnabled ? 'Lock modules (progress gating on)' : 'Unlock modules (progress gating off)'}
                title={moduleLockEnabled ? 'Lock modules (progress gating on)' : 'Unlock modules (progress gating off)'}
              >
              {moduleLockEnabled ? (
                <ChartBarIcon className="w-5 h-5" />
              ) : (
                <LockClosedIcon className="w-5 h-5" />
              )}
              </button>
            </div>

            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="hero-content">

                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-fg mb-4 text-left">
                    Interview Preparation Academy
                  </h1>
                  <p className="text-lg md:text-xl text-muted mb-6 text-left">
                    Master Technical Interviews with Structured Learning
                  </p>
                  <p className="text-muted mb-6 text-left">
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

                <div className="hero-visual relative flex justify-center">
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
                      <text x="50" y="275" textAnchor="middle" fill="currentColor" className="text-primary-fg" fontSize="12">Foundational</text>
                      <text x="150" y="215" textAnchor="middle" fill="currentColor" className="text-primary-fg" fontSize="12">Core</text>
                      <text x="250" y="135" textAnchor="middle" fill="currentColor" className="text-primary-fg" fontSize="12">Specialized</text>
                      <text x="350" y="75" textAnchor="middle" fill="currentColor" className="text-primary-fg" fontSize="12">Expert</text>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filter System */}
        <section className="w-full mb-8">
          <div className="glass-search-container">
            <div className="p-5 md:p-6">
              <div className="search-container mb-4">
                <div className="search-input-wrapper relative">
                  <input
                    type="text"
                    placeholder="Search interview topics, technologies, or modules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="glass-search-input"
                  />
                  <span className="absolute right-3 top-3 text-fg">🔍</span>
                </div>
              </div>

              <div className="filters-container grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="filter-group">
                  <div className="relative">
                    <select
                      value={selectedTier || 'all'}
                      onChange={(e) => setSelectedTier(e.target.value === 'all' ? null : e.target.value)}
                      className="w-full px-3 py-2 pr-10 appearance-none bg-surface border border-border rounded-lg focus:ring-2 ring-focus ring-offset-bg text-fg"
                    >
                      <option value="all">All Tiers</option>
                      <option value="foundational">🏗️ Foundational</option>
                      <option value="core">⚙️ Core Technologies</option>
                      <option value="specialized">💎 Specialized Skills</option>
                      <option value="expert">🏆 Expert Level</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">▾</span>
                  </div>
                </div>

                <div className="filter-group">
                  <div className="relative">
                    <select
                      value={selectedDifficulty || 'all'}
                      onChange={(e) => setSelectedDifficulty(e.target.value === 'all' ? null : e.target.value)}
                      className="w-full px-3 py-2 pr-10 appearance-none bg-surface border border-border rounded-lg focus:ring-2 ring-focus ring-offset-bg text-fg"
                    >
                      <option value="all">All Levels</option>
                      <option value="Beginner">🌱 Beginner</option>
                      <option value="Intermediate">🚀 Intermediate</option>
                      <option value="Advanced">🔥 Advanced</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">▾</span>
                  </div>
                </div>

                <div className="filter-group">
                  <div className="relative">
                    <select
                      value={selectedCategory || 'all'}
                      onChange={(e) => setSelectedCategory(e.target.value === 'all' ? null : e.target.value)}
                      className="w-full px-3 py-2 pr-10 appearance-none bg-surface border border-border rounded-lg focus:ring-2 ring-focus ring-offset-bg text-fg"
                    >
                      <option value="all">All Categories</option>
                      <option value="frontend">🎨 Frontend</option>
                      <option value="backend">⚙️ Backend</option>
                      <option value="database">🗄️ Database</option>
                      <option value="devops">🔧 DevOps</option>
                      <option value="general">📚 General</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">▾</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interview Preparation Tiers */}
        <div id="interview-tiers" className="w-full">
          {hasActiveFilters && Object.keys(filteredTiers).length === 0 && (
            <div className="py-12 text-center bg-surface-alt backdrop-blur-sm rounded-xl shadow-lg border border-border">
              <div className="max-w-3xl mx-auto">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-fg mb-2">No modules found</h3>
                <p className="text-muted mb-6">
                  Try adjusting your search terms or filters to find what you&#39;re looking for.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-primary text-primary-fg rounded-lg hover:brightness-110 transition-colors focus:ring-2 ring-focus ring-offset-bg"
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
              lockEnabled={moduleLockEnabled}
              progress={progress as Record<string, ProgressData>}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <section className="w-full py-8">
          <div className="bg-surface-alt backdrop-blur-sm rounded-xl shadow-lg border border-border">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-center text-fg mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/" className="bg-surface-alt p-6 rounded-lg border border-border text-center hover:brightness-105 transition-colors">
                  <span className="text-5xl block mb-2">🎓</span>
                  <h3 className="text-lg font-semibold text-fg mb-1">Learning Modules</h3>
                  <p className="text-sm text-muted">Return to main learning curriculum and lessons</p>
                </Link>

                <Link href="/playground" className="bg-surface-alt p-6 rounded-lg border border-border text-center hover:brightness-105 transition-colors">
                  <span className="text-5xl block mb-2">🔬</span>
                  <h3 className="text-lg font-semibold text-fg mb-1">GraphQL Playground</h3>
                  <p className="text-sm text-muted">Practice with interactive GraphQL queries</p>
                </Link>

                <Link href="/animated-background-demo" className="bg-surface-alt p-6 rounded-lg border border-border text-center hover:brightness-105 transition-colors">
                  <span className="text-5xl block mb-2">🎨</span>
                  <h3 className="text-lg font-semibold text-fg mb-1">Design Showcase</h3>
                  <p className="text-sm text-muted">Explore our UI components and animations</p>
                </Link>

                <button
                  onClick={exportProgressData}
                  className="bg-surface-alt p-6 rounded-lg border border-border text-center hover:brightness-105 transition-colors"
                >
                  <span className="text-5xl block mb-2">📤</span>
                  <h3 className="text-lg font-semibold text-fg mb-1">Export Progress</h3>
                  <p className="text-sm text-muted">Download progress, streaks, and achievements</p>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default InterviewPrepPage;
