'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';
import type { Module, Tier } from '@/lib/contentRegistry';
import { useProgressTracking } from '../hooks/useProgressTracking';
import GamificationDashboard from '../components/GamificationDashboard';
import SearchFilterSystem from '../components/SearchFilterSystem';
import '../styles/responsive.scss';
import '../styles/design-system.scss';
import '../styles/homepage.scss';
import '../styles/liquid-glass.scss';

// Registry-driven learning structure
interface TierData {
  tier: Tier;
  modules: Module[];
}

interface RegistryData {
  tiers: Record<string, TierData>;
  allModules: Module[];
}

// Enhanced ModuleCard component with accessibility, progress tracking, and achievement indicators
const ModuleCard: React.FC<{ 
  module: Module; 
  tierColor: string;
  tierKey: string;
}> = ({ module, tierColor, tierKey }) => {
  const { progress, updateProgress, achievements } = useProgressTracking();
  const searchParams = useSearchParams();
  const isUnlocked = searchParams.get('unlock') === 'true';
  
  const moduleProgress = progress[module.slug];
  const completionPercentage = moduleProgress ? 
    (moduleProgress.lessonsCompleted / moduleProgress.totalLessons) * 100 : 0;
  
  // Check for achievements related to this module
  const moduleAchievements = achievements.filter(a => a.moduleId === module.slug || a.tier === tierKey);
  const hasAchievements = moduleAchievements.length > 0;
  
  // Determine module status
  const moduleStatus = moduleProgress?.completionStatus || 'not-started';
  
  // Check prerequisites
  const prerequisitesMet = module.prerequisites.every(prereqId => 
    progress[prereqId]?.completionStatus === 'completed'
  );
  
  const isLocked = !isUnlocked && module.prerequisites.length > 0 && !prerequisitesMet;
  
  const handleModuleClick = () => {
    if (!isLocked) {
      updateProgress(module.slug, {
        lastAccessed: new Date().toISOString(),
        timeSpent: (moduleProgress?.timeSpent || 0) + 1
      });
    }
  };
  
  // Define tier-specific gradient classes
  const tierGradientClass = {
    foundational: 'from-blue-500 to-cyan-500',
    core: 'from-green-500 to-emerald-500',
    specialized: 'from-purple-500 to-violet-500',
    quality: 'from-orange-500 to-red-500'
  }[tierKey] || 'from-blue-500 to-cyan-500';
  
  return (
    <div className={`module-card-container ${isLocked ? 'locked' : ''}`}>
      <Link 
        href={isLocked ? '#' : module.routes.overview} 
        className={`block bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-xl transition-all duration-300 ${
          isLocked ? 'opacity-60' : 'hover:-translate-y-1'
        }`}
        onClick={handleModuleClick}
        aria-disabled={isLocked}
        aria-describedby={`module-${module.slug}-description`}
        role="article"
      >
        {/* Achievement badges overlay */}
        {hasAchievements && !isLocked && (
          <div className="absolute -top-2 -right-2 z-10">
            <div className="flex flex-wrap gap-1">
              {moduleAchievements.slice(0, 3).map((achievement, index) => (
                <div 
                  key={achievement.id}
                  className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg"
                  title={achievement.description}
                >
                  <span className="text-xs text-white font-bold">
                    {index === 0 ? '🏆' : index === 1 ? '🎖️' : '⭐'}
                  </span>
                </div>
              ))}
              {moduleAchievements.length > 3 && (
                <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <span className="text-xs text-white font-bold">+{moduleAchievements.length - 3}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Lock overlay for prerequisites */}
        {isLocked && (
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm rounded-xl flex items-center justify-center z-5">
            <div className="text-center text-white">
              <div className="text-3xl mb-2">🔒</div>
              <p className="text-sm font-medium">Prerequisites Required</p>
              <p className="text-xs opacity-80 mt-1">
                Complete: {module.prerequisites.join(', ')}
              </p>
            </div>
          </div>
        )}
        
        <div className="module-header flex items-start gap-4 mb-4">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tierGradientClass} flex items-center justify-center text-white font-bold text-lg`}>
            {module.icon}
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 text-left" id={`module-${module.slug}-title`}>
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
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                moduleStatus === 'not-started' ? 'bg-gray-500/20 text-gray-700 dark:text-gray-300' :
                moduleStatus === 'in-progress' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' :
                'bg-green-500/20 text-green-700 dark:text-green-300'
              }`}>
                {moduleStatus === 'not-started' ? '⏳ Not Started' :
                 moduleStatus === 'in-progress' ? '🔄 In Progress' :
                 '✅ Completed'}
              </span>
            </div>
          </div>
        </div>
        
        <p className="text-gray-700 dark:text-gray-300 mb-4 text-left text-sm" id={`module-${module.slug}-description`}>
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
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
            <span>📅 {module.estimatedHours}h</span>
            <span>{module.track}</span>
          </div>
          
          {moduleProgress && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full bg-gradient-to-r ${tierGradientClass}`}
                style={{ width: `${completionPercentage}%` }}
                role="progressbar"
                aria-valuenow={completionPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${Math.round(completionPercentage)}% complete`}
              />
            </div>
          )}
        </div>
        
        {/* Prerequisites indicator */}
        {module.prerequisites.length > 0 && (
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-500 text-left">
            🔗 Requires: {module.prerequisites.length} prerequisite{module.prerequisites.length > 1 ? 's' : ''}
          </div>
        )}
      </Link>
    </div>
  );
};

// Enhanced TierSection component with better accessibility and visual hierarchy
const TierSection: React.FC<{ 
  tierKey: string;
  tier: Tier;
  modules: Module[];
  isVisible: boolean;
}> = ({ tierKey, tier, modules, isVisible }) => {
  const { getTierProgress, progress } = useProgressTracking();
  const tierProgress = getTierProgress(tierKey as 'foundational' | 'core' | 'specialized' | 'quality');
  const completedModules = modules.filter(module => {
    const moduleProgress = progress[module.slug];
    return moduleProgress?.completionStatus === 'completed';
  }).length;
  
  if (!isVisible) return null;
  
  // Define tier-specific gradient classes
  const tierGradientClass = {
    foundational: 'from-blue-500 to-cyan-500',
    core: 'from-green-500 to-emerald-500',
    specialized: 'from-purple-500 to-violet-500',
    quality: 'from-orange-500 to-red-500'
  }[tierKey] || 'from-blue-500 to-cyan-500';
  
  return (
    <section 
      className="w-full mb-8" // Consistent styling with other sections
      data-tier={tierKey}
      aria-labelledby={`tier-${tierKey}-heading`}
      role="region"
    >
      {/* Tier section with beautiful gradient backgrounds */}
      <div className={`rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br ${tierGradientClass} p-6`}>
        <div className="tier-header mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg backdrop-blur-sm`}>
                  {tier.level}
                </div>
                <div className="text-left">
                  <h2 className="text-xl md:text-2xl font-bold text-white text-left" id={`tier-${tierKey}-heading`}>
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
              <div className="text-2xl font-bold">{tierProgress}%</div>
              <div className="text-sm opacity-90">Complete</div>
              <div className="text-xs opacity-80 mt-1">
                {completedModules} of {modules.length} modules
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6" role="list" aria-label={`${tier.title} modules`}>
          {modules.map((module: Module) => (
            <div key={module.slug} role="listitem">
              <ModuleCard
                module={module}
                tierColor={tier.color}
                tierKey={tierKey}
              />
            </div>
          ))}
        </div>
        
        {/* Tier completion indicator */}
        {tierProgress === 100 && (
          <div className="mt-8 text-center bg-white/10 p-6 rounded-xl border border-white/20 backdrop-blur-sm">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-xl font-bold text-white mb-2">Tier Complete!</h3>
            <p className="text-white/90 mb-4">
              Congratulations! You've mastered the {tier.title} tier.
            </p>
            {tierKey !== 'quality' && (
              <button className="px-6 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm">
                → Continue to Next Tier
              </button>
            )}
            {tierKey === 'quality' && (
              <div className="mt-4">
                <span className="text-3xl block">🏆</span>
                <h4 className="text-lg font-bold text-white mt-1">Full Stack Developer Achieved!</h4>
                <p className="text-white/90 mt-1">You've completed all tiers and mastered full stack development!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

// Enhanced HomePage component with integrated search/filter and progress tracking
const HomePage: React.FC = () => {
  const [registryData, setRegistryData] = useState<RegistryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  
  const { 
    progress,
    calculateOverallProgress, 
    getCompletedModulesCount,
    getTierProgress,
    achievements,
    streak
  } = useProgressTracking();

  // Load registry data
  useEffect(() => {
    async function loadRegistryData() {
      try {
        setLoading(true);
        const [tiers, modules] = await Promise.all([
          contentRegistry.getTiers(),
          contentRegistry.getModules()
        ]);
        
        // Organize modules by tier
        const tierData: Record<string, TierData> = {};
        
        Object.entries(tiers).forEach(([tierKey, tier]) => {
          const tierModules = modules.filter(module => module.tier === tierKey)
                                   .sort((a, b) => a.order - b.order);
          tierData[tierKey] = {
            tier,
            modules: tierModules
          };
        });
        
        setRegistryData({
          tiers: tierData,
          allModules: modules
        });
      } catch (err) {
        console.error('Failed to load registry data:', err);
        setError('Failed to load learning modules. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    loadRegistryData();
  }, []);

  if (loading) {
    return (
      <div className="liquid-glass-layout">
        <div className="max-w-4xl mx-auto">
          <div className="liquid-glass-loading mb-8"></div>
          <div className="space-y-4">
            <div className="liquid-glass-skeleton"></div>
            <div className="liquid-glass-skeleton"></div>
            <div className="liquid-glass-skeleton"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !registryData) {
    return (
      <div className="liquid-glass-layout">
        <div className="max-w-4xl mx-auto">
          <div className="glass-morphism p-8 rounded-xl text-center">
            <div className="text-6xl mb-4">🙁</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {error || 'Unable to load learning modules'}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="glass-button"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();
  const completedModules = getCompletedModulesCount();
  const totalModules = registryData.allModules.length;

  // Get module status helper
  const getModuleStatus = (moduleSlug: string): 'not-started' | 'in-progress' | 'completed' => {
    const moduleProgress = progress[moduleSlug];
    if (!moduleProgress) return 'not-started';
    return moduleProgress.completionStatus;
  };

  // Filter modules based on search and filters
  const filteredTiers = Object.entries(registryData.tiers).reduce((acc, [tierKey, tierData]) => {
    let filteredModules = tierData.modules;

    // Text search filter
    if (searchQuery) {
      filteredModules = filteredModules.filter(module =>
        module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.technologies.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Tier filter
    if (selectedTier && selectedTier !== 'all' && selectedTier !== tierKey) {
      filteredModules = [];
    }

    // Difficulty filter
    if (selectedDifficulty && selectedDifficulty !== 'all') {
      filteredModules = filteredModules.filter(module =>
        module.difficulty.toLowerCase() === selectedDifficulty.toLowerCase()
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filteredModules = filteredModules.filter(module =>
        module.category === selectedCategory
      );
    }

    // Status filter
    if (selectedStatus && selectedStatus !== 'all') {
      filteredModules = filteredModules.filter(module => {
        const moduleStatus = getModuleStatus(module.slug);
        return moduleStatus === selectedStatus;
      });
    }

    if (filteredModules.length > 0) {
      acc[tierKey] = { ...tierData, modules: filteredModules };
    }

    return acc;
  }, {} as Record<string, TierData>);

  // Calculate current streak and recent achievements
  const recentAchievements = achievements
    .sort((a, b) => new Date(b.earnedDate).getTime() - new Date(a.earnedDate).getTime())
    .slice(0, 3);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTier(null);
    setSelectedDifficulty(null);
    setSelectedCategory(null);
    setSelectedStatus(null);
  };

  const skipToMainContent = () => {
    const mainContent = document.getElementById('learning-tiers');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Define the correct tier order for display
  const tierOrder = ['foundational', 'core', 'specialized', 'quality'];

  // Define hasActiveFilters similar to the interview-prep page
  const hasActiveFilters = searchQuery || selectedTier || selectedDifficulty || selectedCategory || selectedStatus;

  return (
    <div className="liquid-glass-layout">
      {/* Ensure no gutters - content spans full width */}
      <main id="main-content" className="homepage w-full" role="main">
        {/* Hero Section with proper styling like the dashboard */}
        <section className="w-full mb-8">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="hero-content">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-left">
                    Master Modern Web Development
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 text-left">
                    Comprehensive learning paths across 18 technology modules with interactive lessons, 
                    real-world projects, and interview preparation.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-lg text-center">
                      <div className="text-sm opacity-90">Total Modules</div>
                      <div className="text-2xl font-bold">{totalModules}</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-lg text-center">
                      <div className="text-sm opacity-90">Completed</div>
                      <div className="text-2xl font-bold">{completedModules}</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-violet-500 text-white p-4 rounded-lg text-center">
                      <div className="text-sm opacity-90">Progress</div>
                      <div className="text-2xl font-bold">{Math.round(overallProgress)}%</div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-lg text-center">
                      <div className="text-sm opacity-90">Streak</div>
                      <div className="text-2xl font-bold">{streak.currentStreak} days</div>
                    </div>
                  </div>
                  
                  {/* Recent achievements showcase */}
                  {recentAchievements.length > 0 && (
                    <div className="mt-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 text-left">Recent Achievements</h2>
                      <div className="space-y-2">
                        {recentAchievements.map(achievement => (
                          <div key={achievement.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center">
                              <span className="text-xl mr-2">🏆</span>
                              <span className="text-gray-700 dark:text-gray-300 flex-1 text-left">{achievement.description}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                {new Date(achievement.earnedDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="hero-visual flex justify-center">
                  <div className="learning-path-visualization w-full max-w-md">
                    <svg viewBox="0 0 400 300" className="path-svg w-full h-auto" role="img" aria-label="Learning path visualization">
                      <defs>
                        <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="25%" stopColor="#10B981" />
                          <stop offset="50%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#F59E0B" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M50,250 Q150,200 200,150 T350,50"
                        stroke="url(#pathGradient)"
                        strokeWidth="6"
                        fill="none"
                        className="learning-path"
                      />
                      <circle cx="50" cy="250" r="12" fill="#3B82F6" className="tier-node" aria-label="Foundational tier" />
                      <circle cx="150" cy="175" r="12" fill="#10B981" className="tier-node" aria-label="Core technologies tier" />
                      <circle cx="250" cy="125" r="12" fill="#8B5CF6" className="tier-node" aria-label="Specialized skills tier" />
                      <circle cx="350" cy="50" r="12" fill="#F59E0B" className="tier-node" aria-label="Quality and testing tier" />
                      <text x="50" y="275" textAnchor="middle" fill="white" fontSize="12">Foundational</text>
                      <text x="150" y="200" textAnchor="middle" fill="white" fontSize="12">Core</text>
                      <text x="250" y="150" textAnchor="middle" fill="white" fontSize="12">Specialized</text>
                      <text x="350" y="75" textAnchor="middle" fill="white" fontSize="12">Quality</text>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Progress & Gamification Dashboard */}
        <GamificationDashboard />

        {/* Enhanced Search and Filter System */}
        <section className="w-full mb-8">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <SearchFilterSystem 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedTier={selectedTier}
                onTierChange={setSelectedTier}
                selectedDifficulty={selectedDifficulty}
                onDifficultyChange={setSelectedDifficulty}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                onClearFilters={clearFilters}
                totalResults={totalModules}
                filteredResults={Object.values(filteredTiers).reduce((sum, tier) => sum + tier.modules.length, 0)}
              />
            </div>
          </div>
        </section>

        {/* Learning Tiers - Proper 4-tier layout with consistent styling */}
        <div 
          id="learning-tiers" 
          className="w-full" 
          tabIndex={-1}
          role="region" 
          aria-label="Learning modules organized by tier"
        >
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
          
          {/* Render tiers in the correct order */}
          {tierOrder.map(tierKey => {
            const tierData = filteredTiers[tierKey];
            if (!tierData) return null;
            
            return (
              <TierSection 
                key={tierKey} 
                tier={tierData.tier} 
                modules={tierData.modules}
                tierKey={tierKey}
                isVisible={!hasActiveFilters || tierData.modules.length > 0}
              />
            );
          })}
        </div>

        {/* Quick Actions */}
        <section className="w-full py-8">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h2 id="quick-actions-heading" className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" role="list">
                <Link href="/playground" className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 text-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" role="listitem">
                  <span className="text-4xl block mb-2" role="img" aria-label="Playground icon">🛝</span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">GraphQL Playground</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Experiment with queries</p>
                </Link>
                
                <Link href="/animated-background-demo" className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 text-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" role="listitem">
                  <span className="text-4xl block mb-2" role="img" aria-label="Design icon">🎨</span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Design Showcase</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">UI components</p>
                </Link>
                
                <Link href="/interview-prep" className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 text-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" role="listitem">
                  <span className="text-4xl block mb-2" role="img" aria-label="Interview icon">💼</span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Interview Prep</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Practice questions</p>
                </Link>
                
                <button 
                  onClick={() => {
                    const progressData = { progress, achievements, streak };
                    const dataStr = JSON.stringify(progressData, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `learning-progress-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 text-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  role="listitem"
                >
                  <span className="text-4xl block mb-2" role="img" aria-label="Export icon">📥</span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Export Progress</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Download data</p>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
