'use client'

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import MobileMenu from './MobileMenu';
import ProfileMenu from './ProfileMenu';
import { useProgressTracking } from '../hooks/useProgressTracking';
// Removed server-only contentRegistry import to avoid bundling Node APIs in client

// Minimal shape for modules from `/api/content/registry` used in this component
type RegistryRoutes = { lessons: string; quiz: string; overview?: string };
interface RegistryModuleFromRegistry {
  slug: string;
  title: string;
  tier: 'foundational' | 'core' | 'specialized' | 'quality';
  routes: RegistryRoutes;
  track?: string;
  category?: string;
  icon?: string;
  estimatedHours?: number;
  order?: number;
}

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
  const [isSpecialisedOpen, setIsSpecialisedOpen] = useState(false);
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [tierGroups, setTierGroups] = useState<Record<string, TierGroup> | null>(null);
  const foundationalRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const specializedRef = useRef<HTMLDivElement>(null);
  const qualityRef = useRef<HTMLDivElement>(null);
  const exploreRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { getTierProgress } = useProgressTracking();

  // Load registry data on component mount
  useEffect(() => {
    const loadRegistryData = async () => {
      try {
        const res = await fetch('/api/content/registry', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Registry API failed: ${res.status}`);
        const registry = await res.json();
        const modules: RegistryModuleFromRegistry[] = (registry && registry.modules) || [];
        
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
                category: (module.track || module.category || 'frontend').toLowerCase() as 'backend' | 'frontend' | 'quality',
                icon: module.icon ?? '',
                estimatedTime: module.estimatedHours ? `${module.estimatedHours} hours` : ''
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
                category: (module.track || module.category || 'frontend').toLowerCase() as 'backend' | 'frontend' | 'quality',
                icon: module.icon ?? '',
                estimatedTime: module.estimatedHours ? `${module.estimatedHours} hours` : ''
              }))
          },
          specialized: {
            tier: 'specialized',
            title: 'Specialised Skills',
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
                category: (module.track || module.category || 'frontend').toLowerCase() as 'backend' | 'frontend' | 'quality',
                icon: module.icon ?? '',
                estimatedTime: module.estimatedHours ? `${module.estimatedHours} hours` : ''
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
                category: (module.track || module.category || 'frontend').toLowerCase() as 'backend' | 'frontend' | 'quality',
                icon: module.icon ?? '',
                estimatedTime: module.estimatedHours ? `${module.estimatedHours} hours` : ''
              }))
          }
        };

        // Enrich with progress percentages for each module if available
        const withProgress = Object.fromEntries(
          Object.entries(tierGroupsData).map(([key, group]) => {
            const enrichedModules = group.modules.map(m => ({
              ...m,
              progress: getTierProgress(group.tier)
            }));
            return [key, { ...group, modules: enrichedModules }];
          })
        );

        setTierGroups(withProgress);
      } catch (error) {
        console.error('Error loading content registry for header navigation:', error);
      }
    };

    loadRegistryData();
  }, [getTierProgress]);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const closeTierDropdowns = () => {
    setIsFoundationalOpen(false);
    setIsCoreOpen(false);
    setIsSpecialisedOpen(false);
    setIsQualityOpen(false);
    setIsExploreOpen(false);
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
        setIsSpecialisedOpen(tier !== activeDropdown);
        break;
      case 'quality':
        setIsQualityOpen(tier !== activeDropdown);
        break;
      case 'explore':
        setIsExploreOpen(tier !== activeDropdown);
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
      <header className="bg-surface backdrop-blur-sm shadow w-full border-b border-border relative z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex-shrink-0 flex items-center min-w-0">
              <Link 
                href="/" 
                className="block truncate max-w-[60vw] sm:max-w-none text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg rounded"
                aria-label="GlassCode Academy Home"
              >
                GlassCode Academy
              </Link>
            </div>
            
            {/* Loading placeholder for desktop menu */}
            <div className="hidden md:flex md:items-center md:space-x-6">
              <div className="h-8 w-24 bg-surface-alt rounded animate-pulse"></div>
              <div className="h-8 w-24 bg-surface-alt rounded animate-pulse"></div>
              <div className="h-8 w-24 bg-surface-alt rounded animate-pulse"></div>
              <div className="h-8 w-24 bg-surface-alt rounded animate-pulse"></div>
              <div className="h-8 w-24 bg-surface-alt rounded animate-pulse"></div>
            </div>
            
            <div className="flex items-center">
              <div className="h-6 w-6 bg-surface-alt rounded-full animate-pulse"></div>
              <div className="md:hidden ml-2">
                <div className="h-6 w-6 bg-surface-alt rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-surface backdrop-blur-sm shadow w-full border-b border-border relative z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex-shrink-0 flex items-center min-w-0">
            <Link 
              href="/" 
              className="block truncate max-w-[60vw] sm:max-w-none text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg rounded"
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
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg ${
                  isFoundationalOpen ? 'bg-surface-alt text-primary' : 'text-fg hover:bg-surface-alt hover:text-primary'
                }`}
                aria-expanded={isFoundationalOpen}
              >
                <span className="mr-2">🏗️</span>
                <span>Foundation</span>
                <div className="ml-1 flex items-center">
                  <span className="text-xs bg-primary text-primary-fg px-1.5 py-0.5 rounded-full mr-1">
                    {getTierProgress('foundational')}%
                  </span>
                  <svg className={`h-4 w-4 transition-transform duration-200 ${isFoundationalOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
              {isFoundationalOpen && (
                <div className="origin-top-left absolute left-0 top-full mt-2 w-80 rounded-xl shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 z-[9999]">
                  <div className="py-2 px-4" role="menu">
                    <div className="text-lg font-bold text-fg mb-2">
                      🏗️ {tierGroups.foundational.title}
                    </div>
                    <div className="text-sm text-muted mb-4 border-b border-border pb-2">
                      {tierGroups.foundational.description}
                    </div>
                    {tierGroups.foundational.modules.map(module => (
                      <div key={module.id} className="mb-3">
                        <div>
                          <div className="text-sm text-fg font-medium truncate">{module.title}</div>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <Link
                              href={module.lessonsPath}
                              className={`${isActive(module.lessonsPath)
                                ? 'bg-surface-alt text-primary'
                                : 'text-muted hover:bg-surface-alt hover:text-primary'
                              } inline-flex items-center justify-center w-full px-3 py-2 text-xs font-medium transition-colors duration-150 rounded-lg`}
                              role="menuitem"
                              onClick={closeTierDropdowns}
                              tabIndex={isFoundationalOpen ? 0 : -1}
                            >
                              <span className="mr-2">📚</span> Lessons
                            </Link>
                            <Link
                              href={module.quizPath}
                              className={`${isActive(module.quizPath)
                                ? 'bg-surface-alt text-primary'
                                : 'text-muted hover:bg-surface-alt hover:text-primary'
                              } inline-flex items-center justify-center w-full px-3 py-2 text-xs font-medium transition-colors duration-150 rounded-lg`}
                              role="menuitem"
                              onClick={closeTierDropdowns}
                            >
                              <span className="mr-2">🧪</span> Quiz
                            </Link>
                          </div>
                        </div>
                        
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Core Tier Dropdown */}
            <div className="relative" ref={coreRef} data-tier="core">
              <button
                onClick={() => handleDropdownToggle('core')}
                onKeyDown={(e) => handleDropdownKeyDown(e, 'core')}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg ${
                  isCoreOpen ? 'bg-surface-alt text-primary' : 'text-fg hover:bg-surface-alt hover:text-primary'
                }`}
                aria-expanded={isCoreOpen}
              >
                <span className="mr-2">⚙️</span>
                <span>Core</span>
                <div className="ml-1 flex items-center">
                  <span className="text-xs bg-primary text-primary-fg px-1.5 py-0.5 rounded-full mr-1">
                    {getTierProgress('core')}%
                  </span>
                  <svg className={`h-4 w-4 transition-transform duration-200 ${isCoreOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
              {isCoreOpen && (
                <div className="origin-top-right absolute right-0 top-full mt-2 w-80 rounded-xl shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 z-[9999]">
                  <div className="py-2 px-4" role="menu">
                    <div className="text-lg font-bold text-fg mb-2">
                      ⚙️ {tierGroups.core.title}
                    </div>
                    <div className="text-sm text-muted mb-4 border-b border-border pb-2">
                      {tierGroups.core.description}
                    </div>
                    {tierGroups.core.modules.map(module => (
                      <div key={module.id} className="mb-3">
                        <div>
                          <div className="text-sm text-fg font-medium truncate">{module.title}</div>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <Link
                              href={module.lessonsPath}
                              className={`${isActive(module.lessonsPath)
                                ? 'bg-surface-alt text-primary'
                                : 'text-muted hover:bg-surface-alt hover:text-primary'
                              } inline-flex items-center justify-center w-full px-3 py-2 text-xs font-medium transition-colors duration-150 rounded-lg`}
                              role="menuitem"
                              onClick={closeTierDropdowns}
                            >
                              <span className="mr-2">📚</span> Lessons
                            </Link>
                            <Link
                              href={module.quizPath}
                              className={`${isActive(module.quizPath)
                                ? 'bg-surface-alt text-primary'
                                : 'text-muted hover:bg-surface-alt hover:text-primary'
                              } inline-flex items-center justify-center w-full px-3 py-2 text-xs font-medium transition-colors duration-150 rounded-lg`}
                              role="menuitem"
                              onClick={closeTierDropdowns}
                            >
                              <span className="mr-2">🧪</span> Quiz
                            </Link>
                          </div>
                        </div>
                        
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Specialised Tier Dropdown */}
            <div className="relative" ref={specializedRef} data-tier="specialized">
              <button
                onClick={() => handleDropdownToggle('specialised')}
                onKeyDown={(e) => handleDropdownKeyDown(e, 'specialised')}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg ${
                  isSpecialisedOpen ? 'bg-surface-alt text-primary' : 'text-fg hover:bg-surface-alt hover:text-primary'
                }`}
                aria-expanded={isSpecialisedOpen}
              >
                <span className="mr-2">💎</span>
                <span>Specialised</span>
                <div className="ml-1 flex items-center">
                  <span className="text-xs bg-primary text-primary-fg px-1.5 py-0.5 rounded-full mr-1">
                    {getTierProgress('specialized')}%
                  </span>
                  <svg className={`h-4 w-4 transition-transform duration-200 ${isSpecialisedOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
              {isSpecialisedOpen && (
                <div className="origin-top-right absolute right-0 top-full mt-2 w-80 rounded-xl shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 z-[9999]">
                  <div className="py-2 px-4" role="menu">
                    <div className="text-lg font-bold text-fg mb-2">
                      💎 {tierGroups.specialized.title}
                    </div>
                    <div className="text-sm text-muted mb-4 border-b border-border pb-2">
                      {tierGroups.specialized.description}
                    </div>
                    {tierGroups.specialized.modules.map(module => (
                      <div key={module.id} className="mb-3">
                        <div>
                          <div className="text-sm text-fg font-medium truncate">{module.title}</div>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <Link
                              href={module.lessonsPath}
                              className={`${isActive(module.lessonsPath)
                                ? 'bg-surface-alt text-primary'
                                : 'text-muted hover:bg-surface-alt hover:text-primary'
                              } inline-flex items-center justify-center w-full px-3 py-2 text-xs font-medium transition-colors duration-150 rounded-lg`}
                              role="menuitem"
                              onClick={closeTierDropdowns}
                            >
                              <span className="mr-2">📚</span> Lessons
                            </Link>
                            <Link
                              href={module.quizPath}
                              className={`${isActive(module.quizPath)
                                ? 'bg-surface-alt text-primary'
                                : 'text-muted hover:bg-surface-alt hover:text-primary'
                              } inline-flex items-center justify-center w-full px-3 py-2 text-xs font-medium transition-colors duration-150 rounded-lg`}
                              role="menuitem"
                              onClick={closeTierDropdowns}
                            >
                              <span className="mr-2">🧪</span> Quiz
                            </Link>
                          </div>
                        </div>
                        
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quality Tier Dropdown */}
            <div className="relative" ref={qualityRef} data-tier="quality">
              <button
                onClick={() => handleDropdownToggle('quality')}
                onKeyDown={(e) => handleDropdownKeyDown(e, 'quality')}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg ${
                  isQualityOpen ? 'bg-surface-alt text-primary' : 'text-fg hover:bg-surface-alt hover:text-primary'
                }`}
                aria-expanded={isQualityOpen}
              >
                <span className="mr-2">🧪</span>
                <span>Quality</span>
                <div className="ml-1 flex items-center">
                  <span className="text-xs bg-primary text-primary-fg px-1.5 py-0.5 rounded-full mr-1">
                    {getTierProgress('quality')}%
                  </span>
                  <svg className={`h-4 w-4 transition-transform duration-200 ${isQualityOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
              {isQualityOpen && (
                <div className="origin-top-right absolute right-0 top-full mt-2 w-80 rounded-xl shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 z-[9999]">
                  <div className="py-2 px-4" role="menu">
                    <div className="text-lg font-bold text-fg mb-2">
                      🧪 {tierGroups.quality.title}
                    </div>
                    <div className="text-sm text-muted mb-4 border-b border-border pb-2">
                      {tierGroups.quality.description}
                    </div>
                    {tierGroups.quality.modules.map(module => (
                      <div key={module.id} className="mb-3">
                        <div>
                          <div className="text-sm text-fg font-medium truncate">{module.title}</div>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <Link
                              href={module.lessonsPath}
                              className={`${isActive(module.lessonsPath)
                                ? 'bg-surface-alt text-primary'
                                : 'text-muted hover:bg-surface-alt hover:text-primary'
                              } inline-flex items-center justify-center w-full px-3 py-2 text-xs font-medium transition-colors duration-150 rounded-lg`}
                              role="menuitem"
                              onClick={closeTierDropdowns}
                            >
                              <span className="mr-2">📚</span> Lessons
                            </Link>
                            <Link
                              href={module.quizPath}
                              className={`${isActive(module.quizPath)
                                ? 'bg-surface-alt text-primary'
                                : 'text-muted hover:bg-surface-alt hover:text-primary'
                              } inline-flex items-center justify-center w-full px-3 py-2 text-xs font-medium transition-colors duration-150 rounded-lg`}
                              role="menuitem"
                              onClick={closeTierDropdowns}
                            >
                              <span className="mr-2">🧪</span> Quiz
                            </Link>
                          </div>
                        </div>
                        
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Explore Dropdown */}
            <div className="relative" ref={exploreRef} data-tier="explore">
              <button
                onClick={() => handleDropdownToggle('explore')}
                onKeyDown={(e) => handleDropdownKeyDown(e, 'explore')}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg ${isExploreOpen ? 'bg-surface-alt text-primary' : 'text-fg hover:bg-surface-alt hover:text-primary'}`}
                aria-expanded={isExploreOpen}
              >
                <span className="mr-1">🧭</span>
                <span>Explore</span>
                <svg className={`ml-1 h-4 w-4 transition-transform duration-200 ${isExploreOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              {isExploreOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-xl shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 z-[9999]">
                  <div className="py-2 px-4" role="menu">
                    <div className="text-lg font-bold text-fg mb-2">🧭 Explore</div>
                    <div className="text-sm text-muted mb-4 border-b border-border pb-2">Quick access</div>
                    <div className="space-y-2">
                      <Link href="/interview-prep" className="block px-3 py-2 text-sm font-medium text-muted hover:bg-surface-alt hover:text-primary rounded transition-colors duration-150" role="menuitem" onClick={closeTierDropdowns}><span className="mr-2">🎯</span> Interview Prep</Link>
                      <Link href="/stats" className="block px-3 py-2 text-sm font-medium text-muted hover:bg-surface-alt hover:text-primary rounded transition-colors duration-150" role="menuitem" onClick={closeTierDropdowns}><span className="mr-2">📊</span> Stats</Link>
                      <Link href="/playground" className="block px-3 py-2 text-sm font-medium text-muted hover:bg-surface-alt hover:text-primary rounded transition-colors duration-150" role="menuitem" onClick={closeTierDropdowns}><span className="mr-2">🔬</span> Playground</Link>
                      <Link href="/animated-background-demo" className="block px-3 py-2 text-sm font-medium text-muted hover:bg-surface-alt hover:text-primary rounded transition-colors duration-150" role="menuitem" onClick={closeTierDropdowns}><span className="mr-2">🎨</span> Design Showcase</Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right side icons */}
          <div className="flex items-center">
            <ProfileMenu />
            <div className="md:hidden ml-2">
              <MobileMenu />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}