'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRightIcon, ChartBarIcon, LockClosedIcon } from '@heroicons/react/24/outline';

import { contentRegistry } from '@/lib/contentRegistry';
import type { Module, Tier } from '@/lib/contentRegistry';
import { useProgressTracking, ProgressData, AchievementData } from '../hooks/useProgressTracking';
import GamificationDashboard from '../components/GamificationDashboard';
import SearchFilterSystem from '../components/SearchFilterSystem';
import '../styles/responsive.scss';
import '../styles/design-system.scss';
import '../styles/homepage.scss';
import '../styles/liquid-glass.scss';
import '../styles/mobile-first.scss';
import { getModuleTheme } from '@/lib/moduleThemes';

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
  tierKey: string;
  moduleStatus: string;
  completionPercentage: number;
  hasAchievements: boolean;
  moduleAchievements: AchievementData[];
  isLocked: boolean;
  handleModuleClick: () => void;
}> = React.memo(({ 
  module, 
  tierKey, 
  moduleStatus, 
  completionPercentage, 
  hasAchievements, 
  moduleAchievements, 
  isLocked, 
  handleModuleClick 
}) => {
  // Using tier-container gradient variants; removed tierGradientClass

  const theme = getModuleTheme(module.slug);

  return (
    <div className={`module-card-container ${isLocked ? 'locked' : ''} h-full`}>
      <Link
        href={isLocked ? '#' : (module.routes?.overview || '#')}
        className={`glass-module-card group ${tierKey === 'core' ? 'tier-core' : tierKey === 'specialized' ? 'tier-specialized' : tierKey === 'quality' ? 'tier-quality' : 'tier-foundational'} ${isLocked ? 'opacity-60' : ''} pb-8 no-tier-strip`}
        onClick={handleModuleClick}
        aria-disabled={isLocked}
        aria-describedby={`module-${module.slug}-description`}
        >
        {/* Achievement badges overlay moved outside the Link to prevent overflow clipping */}

        {/* Decorative top strip using module brand gradient */}
        <div className={`absolute inset-x-0 top-0 h-[4px] ${theme.strip} z-10 pointer-events-none`} aria-hidden="true"></div>

        {/* Achievements overlay in top-right */}
        {hasAchievements && (
          <div className="absolute top-3 right-3 z-20 flex gap-2">
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

        <div className="module-header flex items-stretch gap-4 mb-4">
          <div className="module-icon text-white text-5xl leading-none flex items-center">
            {module.icon || '📚'}
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-fg mb-2 text-left" id={`module-${module.slug}-title`}>
              {module.title || 'Untitled Module'}
            </h4>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                (module.difficulty || 'Beginner') === 'Beginner' ? 'bg-green-500/20 text-fg' :
                (module.difficulty || 'Beginner') === 'Intermediate' ? 'bg-yellow-500/20 text-fg' :
                'bg-red-500/20 text-fg'
              }`}>
                {module.difficulty || 'Beginner'}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                moduleStatus === 'not-started' ? 'bg-surface-alt text-fg' :
                moduleStatus === 'in-progress' ? 'bg-blue-500/20 text-fg' :
                'bg-green-500/20 text-fg'
              }`}>
                {moduleStatus === 'not-started' ? '⏳ Not Started' :
                 moduleStatus === 'in-progress' ? '🔄 In Progress' :
                 '✅ Completed'}
              </span>
            </div>
          </div>
        </div>

        <p className="text-muted mb-4 text-left text-sm" id={`module-${module.slug}-description`}>
          {module.description || 'No description available.'}
        </p>

        {/* Technologies used - Pill-shaped tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {(module.technologies || []).slice(0, 3).map(tech => (
            <span key={tech} className="px-2 py-1 bg-surface-alt text-fg rounded-full text-xs">
              {tech}
            </span>
          ))}
          {(module.technologies || []).length > 3 && (
            <span className="px-2 py-1 bg-surface-alt text-fg rounded-full text-xs">+{module.technologies.length - 3} more</span>
          )}
        </div>

        {/* Progress bar and Achievements */}
        <div className="mt-auto">
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${completionPercentage}%` }}></div>
          </div>

          {false && hasAchievements && (
            <div className="achievements-list mt-3">
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
          )}
        </div>
        {/* Bottom-right arrow indicator */}
        {!isLocked && (
          <ArrowRightIcon
            className="absolute right-4 bottom-4 h-5 w-5 text-white/70 group-hover:text-white transition-colors pointer-events-none"
            aria-hidden="true"
          />
        )}
      </Link>
    </div>
  );
});

ModuleCard.displayName = 'ModuleCard';

// Enhanced TierSection component with better accessibility and visual hierarchy
const TierSection: React.FC<{
  tierKey: string;
  tier: Tier;
  modules: Module[];
  isVisible: boolean;
  progress: Record<string, ProgressData>;
  achievements: AchievementData[];
  lockEnabled?: boolean;
}> = React.memo(({ tierKey, tier, modules, isVisible, progress, achievements, lockEnabled = true }) => {
  const { getTierProgress } = useProgressTracking();
  const tierProgress = getTierProgress(tierKey as 'foundational' | 'core' | 'specialized' | 'quality');
  const completedModules = modules.filter(module => {
    const moduleProgress = progress[module.slug];
    return moduleProgress?.completionStatus === 'completed';
  }).length;

  if (!isVisible) return null;

  // Using tier-container gradient variants; removed tierGradientClass

  return (
    <section
      className="w-full mb-8 mf-edge-to-edge mf-no-vertical-margin-mobile" // Consistent styling with other sections
      data-tier={tierKey}
      aria-labelledby={`tier-${tierKey}-heading`}
      role="region"
    >
      {/* Tier section with beautiful gradient backgrounds */}
      <div className={`tier-container ${tierKey === 'core' ? 'tier-core' : tierKey === 'specialized' ? 'tier-specialized' : tierKey === 'quality' ? 'tier-quality' : 'tier-foundational'} mf-pane-reset`}>
        <div className="tier-header mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-2xl backdrop-blur-sm`}>
                  {tier.level}
                </div>
                <div className="text-left">
                  <h2 className="text-xl md:text-2xl font-bold text-white text-left" id={`tier-${tierKey}-heading`}>
                    {tier.title}
                  </h2>
                  <p className="text-fg mt-1 text-left text-sm">{tier.description}</p>
                </div>
              </div>

            </div>

            <div className="glass-morphism rounded-lg p-4">
              <p className="font-medium text-fg text-left text-sm">
                <strong>Focus Area:</strong> {tier.focusArea}
              </p>
            </div>

            {/* Unified progress widget like dashboard */}
            <div className="glass-morphism text-fg p-4 rounded-lg min-w-[140px] text-center">
              <div className="text-2xl font-bold">{tierProgress}%</div>
              <div className="text-sm">Complete</div>
              <div className="text-xs mt-1">
                {completedModules} of {modules.length} modules
              </div>
            </div>
          </div>

          {/* Learning objectives */}
          <div className="glass-morphism rounded-xl p-5 mt-4">
            <h3 className="text-lg font-semibold text-fg mb-3 text-left">Learning Objectives</h3>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(tier.learningObjectives || []).map((objective, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-green-500 flex-shrink-0 text-sm leading-none">✓</span>
                  <span className="text-fg text-left text-sm leading-tight">{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modules grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 auto-rows-fr" role="list" aria-label={`${tier.title} modules`}>
          {modules.map((module: Module) => {
            const moduleProgress = progress[module.slug] || null;
            const completionPercentage = moduleProgress ?
              (moduleProgress.lessonsCompleted / moduleProgress.totalLessons) * 100 : 0;
              
            // Check for achievements related to this module
            const moduleAchievements = achievements.filter(a => a.moduleId === module.slug || a.tier === tierKey);
            const hasAchievements = moduleAchievements.length > 0;
            
            // Determine module status
            const moduleStatus = moduleProgress?.completionStatus || 'not-started';

            // Compute prerequisites met using progress
            const prereqs = module.prerequisites || [];
            const prerequisitesMet = prereqs.length === 0 || prereqs.every((slug) => {
              const p = progress[slug];
              return p && p.completionStatus === 'completed';
            });
            const isLocked = !!lockEnabled && prereqs.length > 0 && !prerequisitesMet;
            
            return (
              <div key={module.slug} role="listitem" className="h-full">
                <ModuleCard
                  module={module}
                  tierKey={tierKey}
                  moduleStatus={moduleStatus}
                  completionPercentage={completionPercentage}
                  hasAchievements={hasAchievements}
                  moduleAchievements={moduleAchievements}
                  isLocked={isLocked}
                  handleModuleClick={() => {}}
                />
              </div>
            );
          })}
        </div>

        {/* Tier completion indicator */}
        {tierProgress === 100 && (
          <div className="mt-8 text-center bg-white/10 p-6 rounded-xl border border-white/20 backdrop-blur-sm">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-xl font-bold text-white mb-2">Tier Complete!</h3>
            <p className="text-white/90 mb-4">
              Congratulations! You&apos;ve mastered the {tier.title} tier.
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
                <p className="text-white/90 mt-1">You&apos;ve completed all tiers and mastered full stack development!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
});

TierSection.displayName = 'TierSection';

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
  // Toggle for interview module gating
  const [moduleLockEnabled, setModuleLockEnabled] = useState<boolean>(true);

  const {
    progress,
    calculateOverallProgress,
    getCompletedModulesCount,
    achievements,
    streak
  } = useProgressTracking();

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('gc.moduleLockEnabled') : null;
      if (stored !== null) {
        setModuleLockEnabled(stored === 'true');
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const toggleModuleLock = useCallback(() => {
    setModuleLockEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('gc.moduleLockEnabled', next ? 'true' : 'false');
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Clear all filters - defined before any conditional returns
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedTier(null);
    setSelectedDifficulty(null);
    setSelectedCategory(null);
    setSelectedStatus(null);
  }, []);

  // Load registry data with useCallback to prevent unnecessary re-renders
  const loadRegistryData = useCallback(async () => {
    try {
      setLoading(true);
      // Pre-fetch commonly used data to improve performance
      const [tiers, modules] = await Promise.all([
        contentRegistry.getTiers(),
        contentRegistry.getModules()
      ]);

      // Organize modules by tier
      const tierData: Record<string, TierData> = {};

      Object.entries(tiers || {}).forEach(([tierKey, tier]) => {
        const tierModules = modules
          .filter(module => module.tier === tierKey)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        tierData[tierKey] = {
          tier,
          modules: tierModules
        };
      });

      setRegistryData({
        tiers: tierData,
        allModules: modules || []
      });
    } catch (err) {
      console.error('Failed to load registry data:', err);
      setError('Failed to load learning modules. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Pre-fetch data on component mount
  useEffect(() => {
    loadRegistryData();

    // Start comprehensive background prefetch for lessons and quizzes (unlocked by tier)
    if (typeof window !== 'undefined') {
      // Slight delay so initial paint remains snappy
      setTimeout(() => {
        import('@/lib/modulePrefetchService')
          .then(({ modulePrefetchService }) => {
            modulePrefetchService.startPrefetching('tier');
          })
          .catch(() => { /* ignore prefetch bootstrap errors */ });
      }, 1500);
    }
  }, [loadRegistryData]);

  // Memoize filtered tiers to prevent unnecessary re-renders
  const filteredTiers = useMemo(() => {
    if (!registryData) return {};
    
    return Object.entries(registryData.tiers).reduce((acc, [tierKey, tierData]) => {
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
      const getModuleStatus = (moduleSlug: string): 'not-started' | 'in-progress' | 'completed' => {
        const moduleProgress = progress[moduleSlug];
        if (!moduleProgress) return 'not-started';
        return moduleProgress.completionStatus;
      };

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
  }, [registryData, searchQuery, selectedTier, selectedDifficulty, selectedCategory, selectedStatus, progress]);

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


  // Calculate current streak and recent achievements
  const recentAchievements = achievements
    .sort((a, b) => new Date(b.earnedDate).getTime() - new Date(a.earnedDate).getTime())
    .slice(0, 3);

  // Define the correct tier order for display
  const tierOrder = ['foundational', 'core', 'specialized', 'quality'];

  // Define hasActiveFilters similar to the interview-prep page
  const hasActiveFilters = searchQuery || selectedTier || selectedDifficulty || selectedCategory || selectedStatus;

  return (
    <div className="liquid-glass-layout">
      {/* Ensure no gutters - content spans full width */}
      <main id="main-content" className="homepage w-full" role="main">
        {/* Hero Section with optimized styling for better LCP */}
        <section className="w-full mb-8 mf-edge-to-edge mf-no-vertical-margin-mobile">
          <div className="relative bg-white/95 dark:bg-gray-800/95 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mf-pane-reset">
            <div className="absolute top-6 right-6 md:top-8 md:right-8">
              <button
                type="button"
                onClick={toggleModuleLock}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border bg-gray-100/60 dark:bg-gray-700/40 border-gray-300/40 dark:border-gray-600/40 text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-600/50 transition-colors"
                aria-pressed={moduleLockEnabled}
                aria-label={moduleLockEnabled ? 'Lock modules (progress gating on)' : 'Unlock modules (progress gating off)'}
                title={moduleLockEnabled ? 'Lock modules (progress gating on)' : 'Unlock modules (progress gating off)'}
              >
                {moduleLockEnabled ? (
                  <LockClosedIcon className="w-5 h-5" />
                ) : (
                  <ChartBarIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="hero-content">
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 text-left">Master Modern Web Development</h1>
                  </div>
                  <p className="text-lg md:text-xl text-muted mb-6 text-left">
                    Comprehensive learning paths across 18 technology modules with interactive lessons,
                    real-world projects, and interview preparation.
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-lg text-center">
                      <div className="text-sm">Total Modules</div>
                      <div className="text-2xl font-bold">{totalModules}</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-lg text-center">
                      <div className="text-sm">Completed</div>
                      <div className="text-2xl font-bold">{completedModules}</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-violet-500 text-white p-4 rounded-lg text-center">
                      <div className="text-sm">Progress</div>
                      <div className="text-2xl font-bold">{Math.round(overallProgress)}%</div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-lg text-center">
                      <div className="text-sm">Streak</div>
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
                              <span className="text-xs text-muted">
                                {new Date(achievement.earnedDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="hero-visual relative flex justify-center">
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
                      <circle cx="150" cy="190" r="12" fill="#10B981" className="tier-node" aria-label="Core technologies tier" />
                      <circle cx="250" cy="110" r="12" fill="#8B5CF6" className="tier-node" aria-label="Specialized skills tier" />
                      <circle cx="350" cy="50" r="12" fill="#F59E0B" className="tier-node" aria-label="Quality and testing tier" />
                      <text x="50" y="275" textAnchor="middle" fill="white" fontSize="12">Foundational</text>
                      <text x="150" y="215" textAnchor="middle" fill="white" fontSize="12">Core</text>
                      <text x="250" y="135" textAnchor="middle" fill="white" fontSize="12">Specialized</text>
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
          <div className="glass-search-container">
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
            <div className="py-12 text-center glass-morphism">
              <div className="max-w-3xl mx-auto">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No modules found</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Try adjusting your search terms or filters to find what you&apos;re looking for.
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
                progress={progress}
                achievements={achievements}
                lockEnabled={moduleLockEnabled}
              />
            );
          })}
        </div>

        {/* Quick Actions */}
        <section className="w-full py-8">
          <div className="glass-morphism rounded-xl">
            <div className="p-6">
              <h2 id="quick-actions-heading" className="text-2xl font-bold text-center text-fg mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" role="list">
                <Link href="/playground" className="glass-morphism p-6 rounded-lg text-center" role="listitem">
                  <span className="text-5xl block mb-2" role="img" aria-label="Playground icon">🛝</span>
                  <h3 className="text-lg font-semibold text-fg mb-1">GraphQL Playground</h3>
                  <p className="text-sm text-muted">Experiment with queries</p>
                </Link>

                <Link href="/animated-background-demo" className="glass-morphism p-6 rounded-lg text-center" role="listitem">
                  <span className="text-5xl block mb-2" role="img" aria-label="Design icon">🎨</span>
                  <h3 className="text-lg font-semibold text-fg mb-1">Design Showcase</h3>
                  <p className="text-sm text-muted">UI components</p>
                </Link>

                <Link href="/interview-prep" className="glass-morphism p-6 rounded-lg text-center" role="listitem">
                  <span className="text-5xl block mb-2" role="img" aria-label="Interview icon">💼</span>
                  <h3 className="text-lg font-semibold text-fg mb-1">Interview Prep</h3>
                  <p className="text-sm text-muted">Practice questions</p>
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
                  className="glass-morphism p-6 rounded-lg text-center"
                  role="listitem"
                >
                  <span className="text-5xl block mb-2" role="img" aria-label="Export icon">📥</span>
                  <h3 className="text-lg font-semibold text-fg mb-1">Export Progress</h3>
                  <p className="text-sm text-muted">Download data</p>
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