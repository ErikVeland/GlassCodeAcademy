'use client'

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import MobileMenu from './MobileMenu';
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
                <span className="mr-1">🏗️</span>
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
                <div className="origin-top-left absolute left-0 mt-2 w-80 rounded-xl shadow-lg bg-surface/95 backdrop-blur-sm ring-1 ring-black ring-opacity-5 z-[9999] border border-border max-h-96 overflow-y-auto">
                  <div className="py-2 px-4" role="menu">
                    <div className="text-lg font-bold text-fg mb-2">
                      🏗️ {tierGroups.foundational.title}
                    </div>
                    <div className="text-sm text-muted mb-4 border-b border-border pb-2">
                      {tierGroups.foundational.description}
                    </div>
                    {tierGroups.foundational.modules.map(module => (
                      <div key={module.id} className="flex items-center space-x-2 mb-2">
                        <Link
                          href={module.lessonsPath}
                          className={`${
                            isActive(module.lessonsPath)
                              ? 'bg-surface-alt text-primary'
                              : 'text-muted hover:bg-surface-alt hover:text-primary'
                          } block px-3 py-2 text-xs font-medium transition-colors duration-150 backdrop-blur-sm rounded flex-1 text-center focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg`}
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
                              ? 'bg-surface-alt text-primary'
                              : 'text-muted hover:bg-surface-alt hover:text-primary'
                          } block px-3 py-2 text-xs font-medium transition-colors duration-150 backdrop-blur-sm rounded flex-1 text-center focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg`}
                          role="menuitem"
                          onClick={closeTierDropdowns}
                        >
                          🧪 Quiz
                        </Link>
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
                <span className="mr-1">⚙️</span>
                <span>Core</span>
                <div className="ml-1 flex items-center">
                  <span className="text-xs bg-success text-primary-fg px-1.5 py-0.5 rounded-full mr-1">
                    {getTierProgress('core')}%
                  </span>
                  <svg className={`h-4 w-4 transition-transform duration-200 ${isCoreOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
              {isCoreOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-lg bg-surface/95 backdrop-blur-sm ring-1 ring-black ring-opacity-5 z-[9999] border border-border max-h-96 overflow-y-auto">
                  <div className="py-2 px-4" role="menu">
                    <div className="text-lg font-bold text-fg mb-2">
                      ⚙️ {tierGroups.core.title}
                    </div>
                    <div className="text-sm text-muted mb-4 border-b border-border pb-2">
                      {tierGroups.core.description}
                    </div>
                    {tierGroups.core.modules.map(module => (
                      <div key={module.id} className="flex items-center space-x-2 mb-2">
                        <Link
                          href={module.lessonsPath}
                          className={`${
                            isActive(module.lessonsPath)
                              ? 'bg-surface-alt text-primary'
                              : 'text-muted hover:bg-surface-alt hover:text-primary'
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
                              ? 'bg-surface-alt text-primary'
                              : 'text-muted hover:bg-surface-alt hover:text-primary'
                          } block px-3 py-2 text-xs font-medium transition-colors duration-150 backdrop-blur-sm rounded flex-1 text-center`}
                          role="menuitem"
                          onClick={closeTierDropdowns}
                        >
                          🧪 Quiz
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Specialized Tier Dropdown */}
            <div className="relative" ref={specializedRef} data-tier="specialized">
              <button
                onClick={() => handleDropdownToggle('specialized')}
                onKeyDown={(e) => handleDropdownKeyDown(e, 'specialized')}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg ${
                  isSpecializedOpen ? 'bg-surface-alt text-primary' : 'text-fg hover:bg-surface-alt hover:text-primary'
                }`}
                aria-expanded={isSpecializedOpen}
              >
                <span className="mr-1">💎</span>
                <span>Specialized</span>
                <div className="ml-1 flex items-center">
                  <span className="text-xs bg-primary text-primary-fg px-1.5 py-0.5 rounded-full mr-1">
                    {getTierProgress('specialized')}%
                  </span>
                  <svg className={`h-4 w-4 transition-transform duration-200 ${isSpecializedOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
              {isSpecializedOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-lg bg-surface/95 backdrop-blur-sm ring-1 ring-black ring-opacity-5 z-[9999] border border-border max-h-96 overflow-y-auto">
                  <div className="py-2 px-4" role="menu">
                    <div className="text-lg font-bold text-fg mb-2">
                      💎 {tierGroups.specialized.title}
                    </div>
                    <div className="text-sm text-muted mb-4 border-b border-border pb-2">
                      {tierGroups.specialized.description}
                    </div>
                    {tierGroups.specialized.modules.map(module => (
                      <div key={module.id} className="flex items-center space-x-2 mb-2">
                        <Link
                          href={module.lessonsPath}
                          className={`${
                            isActive(module.lessonsPath)
                              ? 'bg-surface-alt text-primary'
                              : 'text-muted hover:bg-surface-alt hover:text-primary'
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
                              ? 'bg-surface-alt text-primary'
                              : 'text-muted hover:bg-surface-alt hover:text-primary'
                          } block px-3 py-2 text-xs font-medium transition-colors duration-150 backdrop-blur-sm rounded flex-1 text-center`}
                          role="menuitem"
                          onClick={closeTierDropdowns}
                        >
                          🧪 Quiz
                        </Link>
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
                <span className="mr-1">🧪</span>
                <span>Quality</span>
                <div className="ml-1 flex items-center">
                  <span className="text-xs text-muted">
                    {tierGroups.quality.modules.length} modules
                  </span>
                  <svg className={`h-4 w-4 transition-transform duration-200 ${isQualityOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
              {isQualityOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-lg bg-surface/95 backdrop-blur-sm ring-1 ring-black ring-opacity-5 z-[9999] border border-border max-h-96 overflow-y-auto">
                  <div className="py-2 px-4" role="menu">
                    <div className="text-lg font-bold text-fg mb-2">
                      🧪 {tierGroups.quality.title}
                    </div>
                    <div className="text-sm text-muted mb-4 border-b border-border pb-2">
                      {tierGroups.quality.description}
                    </div>
                    {tierGroups.quality.modules.map(module => (
                      <div key={module.id} className="flex items-center space-x-2 mb-2">
                        <div className="flex flex-col flex-1">
                          <div className="flex items-center justify-between">
                            <Link
                              href={module.lessonsPath}
                              className={`${
                                isActive(module.lessonsPath)
                                  ? 'bg-surface-alt text-primary'
                                  : 'text-muted hover:bg-surface-alt hover:text-primary'
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
                                  ? 'bg-surface-alt text-primary'
                                  : 'text-muted hover:bg-surface-alt hover:text-primary'
                              } block px-3 py-2 text-xs font-medium transition-colors duration-150 backdrop-blur-sm rounded flex-1 text-center`}
                              role="menuitem"
                              onClick={closeTierDropdowns}
                            >
                              🧪 Quiz
                            </Link>
                          </div>
                          <span className="text-xs text-muted">
                            {module.estimatedTime}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={module.lessonsPath}
                            className={`${
                              isActive(module.lessonsPath)
                                ? 'bg-surface-alt text-primary'
                                : 'text-muted hover:bg-surface-alt hover:text-primary'
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
                                ? 'bg-surface-alt text-primary'
                                : 'text-muted hover:bg-surface-alt hover:text-primary'
                            } block px-3 py-2 text-xs font-medium transition-colors duration-150 backdrop-blur-sm rounded flex-1 text-center`}
                            role="menuitem"
                            onClick={closeTierDropdowns}
                          >
                            🧪 Quiz
                          </Link>
                        </div>
                      </div>
                    ))}
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