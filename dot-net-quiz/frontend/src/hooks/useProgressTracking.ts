import { useState, useEffect } from 'react';

export interface ProgressData {
  moduleId: string;
  lessonsCompleted: number;
  totalLessons: number;
  quizScore: number;
  timeSpent: number;
  lastAccessed: string;
  completionStatus: 'not-started' | 'in-progress' | 'completed';
  badges: string[];
  completedTopics: string[];
  tier: 'foundational' | 'core' | 'specialized' | 'quality';
  certificate?: {
    earned: boolean;
    earnedDate: string;
    shareUrl: string;
  };
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  activityDates: string[];
}

export interface AchievementData {
  id: string;
  type: 'completion' | 'streak' | 'skill' | 'velocity';
  earnedDate: string;
  description: string;
  badgeUrl: string;
  moduleId?: string;
  tier?: 'foundational' | 'core' | 'specialized' | 'quality';
}

const STORAGE_KEYS = {
  PROGRESS: 'fullstack_progress_veland',
  STREAK: 'fullstack_streak_veland',
  ACHIEVEMENTS: 'fullstack_achievements_veland'
};

// Tier-based module mapping
const TIER_MODULES = {
  foundational: ['programming-basics', 'web-fundamentals', 'version-control'],
  core: ['dotnet-core', 'react', 'database', 'laravel'],
  specialized: ['nextjs', 'graphql', 'microservices', 'devops'],
  quality: ['testing-fundamentals', 'e2e-testing', 'performance', 'security']
};

// Achievement definitions with proper metadata
const ACHIEVEMENT_DEFINITIONS = {
  'first-lesson': {
    type: 'velocity' as const,
    description: 'Completed your first lesson',
    badgeUrl: '/badges/first-lesson.svg'
  },
  'foundation-master': {
    type: 'completion' as const,
    description: 'Master of foundational concepts',
    badgeUrl: '/badges/foundation-master.svg',
    tier: 'foundational' as const
  },
  'core-developer': {
    type: 'completion' as const,
    description: 'Core technologies specialist',
    badgeUrl: '/badges/core-developer.svg',
    tier: 'core' as const
  },
  'specialist': {
    type: 'completion' as const,
    description: 'Advanced skills specialist',
    badgeUrl: '/badges/specialist.svg',
    tier: 'specialized' as const
  },
  'quality-guardian': {
    type: 'completion' as const,
    description: 'Quality and testing expert',
    badgeUrl: '/badges/quality-guardian.svg',
    tier: 'quality' as const
  },
  'speed-learner': {
    type: 'velocity' as const,
    description: 'Completed 5 lessons in one day',
    badgeUrl: '/badges/speed-learner.svg'
  },
  'perfectionist': {
    type: 'skill' as const,
    description: 'Achieved perfect scores on 10 quizzes',
    badgeUrl: '/badges/perfectionist.svg'
  },
  'streak-warrior': {
    type: 'streak' as const,
    description: 'Maintained a 7-day learning streak',
    badgeUrl: '/badges/streak-warrior.svg'
  },
  'streak-legend': {
    type: 'streak' as const,
    description: 'Maintained a 30-day learning streak',
    badgeUrl: '/badges/streak-legend.svg'
  },
  'full-stack': {
    type: 'skill' as const,
    description: 'Completed both frontend and backend modules',
    badgeUrl: '/badges/full-stack.svg'
  }
};

export const useProgressTracking = () => {
  const [progress, setProgress] = useState<Record<string, ProgressData>>({});
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    activityDates: []
  });
  const [achievements, setAchievements] = useState<AchievementData[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (savedProgress) {
        setProgress(JSON.parse(savedProgress));
      }

      const savedStreak = localStorage.getItem(STORAGE_KEYS.STREAK);
      if (savedStreak) {
        setStreak(JSON.parse(savedStreak));
      }

      const savedAchievements = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      if (savedAchievements) {
        setAchievements(JSON.parse(savedAchievements));
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  }, []);

  const updateProgress = (moduleId: string, data: Partial<ProgressData>) => {
    const currentTime = new Date().toISOString();
    
    // Determine tier for module using registry
    const tier = determineTierFromRegistry(moduleId) || 'foundational';
    
    // Get accurate lesson count from registry/content
    const totalLessons = getActualLessonCount(moduleId);
    
    const defaultProgressData = {
      moduleId,
      lessonsCompleted: 0,
      totalLessons,
      quizScore: 0,
      timeSpent: 0,
      completionStatus: 'not-started' as const,
      badges: [],
      completedTopics: [],
      tier,
      certificate: undefined
    };
    
    const currentProgress = {
      ...defaultProgressData,
      ...progress[moduleId],
      ...data,
      lastAccessed: currentTime
    };
    
    // Auto-calculate completion status based on lessons and quiz
    if (currentProgress.lessonsCompleted >= currentProgress.totalLessons && 
        currentProgress.quizScore >= 70) {
      currentProgress.completionStatus = 'completed';
    } else if (currentProgress.lessonsCompleted > 0 || currentProgress.quizScore > 0) {
      currentProgress.completionStatus = 'in-progress';
    }
    
    const updated = {
      ...progress,
      [moduleId]: currentProgress
    };
    
    setProgress(updated);
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(updated));
    
    // Update streak
    updateStreak();
    
    // Check for new achievements
    checkAchievements(updated, moduleId);
  };

  // Helper function to get tier from registry
  const determineTierFromRegistry = (moduleSlug: string): string | null => {
    // This would integrate with the content registry
    // For now, use the existing mapping as fallback
    const tierEntry = Object.entries(TIER_MODULES).find(([, modules]) => 
      modules.includes(moduleSlug)
    );
    return tierEntry?.[0] || null;
  };

  // Helper function to get actual lesson count
  const getActualLessonCount = (moduleSlug: string): number => {
    // This would fetch from the actual content files
    // For now, return default based on tier
    const tier = determineTierFromRegistry(moduleSlug);
    const defaultCounts = {
      foundational: 12,
      core: 15,
      specialized: 14,
      quality: 14
    };
    return defaultCounts[tier as keyof typeof defaultCounts] || 12;
  };

  const updateStreak = () => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    const updatedStreak = { ...streak };
    
    if (streak.lastActiveDate !== today) {
      // Add today to activity dates
      const newActivityDates = [...streak.activityDates, today];
      
      if (streak.lastActiveDate === yesterday) {
        // Consecutive day
        updatedStreak.currentStreak += 1;
      } else if (streak.lastActiveDate) {
        // Streak broken
        updatedStreak.currentStreak = 1;
      } else {
        // First day
        updatedStreak.currentStreak = 1;
      }
      
      updatedStreak.longestStreak = Math.max(updatedStreak.longestStreak, updatedStreak.currentStreak);
      updatedStreak.lastActiveDate = today;
      updatedStreak.activityDates = newActivityDates.slice(-365); // Keep last year of data
      
      setStreak(updatedStreak);
      localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(updatedStreak));
    }
  };

  const checkAchievements = (progressData: Record<string, ProgressData>, moduleId: string) => {
    const newAchievements: AchievementData[] = [];
    const currentTime = new Date().toISOString();
    
    // Helper function to create achievement with proper metadata
    const createAchievement = (id: keyof typeof ACHIEVEMENT_DEFINITIONS, moduleId?: string): AchievementData => {
      const definition = ACHIEVEMENT_DEFINITIONS[id];
      return {
        id,
        type: definition.type,
        earnedDate: currentTime,
        description: definition.description,
        badgeUrl: definition.badgeUrl,
        moduleId,
        tier: 'tier' in definition ? definition.tier : undefined
      };
    };
    
    // First lesson achievement
    if (!achievements.find(a => a.id === 'first-lesson')) {
      const hasCompletedLesson = Object.values(progressData).some(p => p.lessonsCompleted > 0);
      if (hasCompletedLesson) {
        newAchievements.push(createAchievement('first-lesson', moduleId));
      }
    }
    
    // Foundation master achievement
    if (!achievements.find(a => a.id === 'foundation-master')) {
      const foundationalModules = TIER_MODULES.foundational;
      const foundationCompleted = foundationalModules.every(mod => 
        progressData[mod]?.completionStatus === 'completed'
      );
      if (foundationCompleted) {
        newAchievements.push(createAchievement('foundation-master', moduleId));
      }
    }
    
    // Core developer achievement
    if (!achievements.find(a => a.id === 'core-developer')) {
      const coreModules = TIER_MODULES.core;
      const coreCompleted = coreModules.every(mod => 
        progressData[mod]?.completionStatus === 'completed'
      );
      if (coreCompleted) {
        newAchievements.push(createAchievement('core-developer', moduleId));
      }
    }
    
    // Specialist achievement
    if (!achievements.find(a => a.id === 'specialist')) {
      const specializedModules = TIER_MODULES.specialized;
      const specializedCompleted = specializedModules.every(mod => 
        progressData[mod]?.completionStatus === 'completed'
      );
      if (specializedCompleted) {
        newAchievements.push(createAchievement('specialist', moduleId));
      }
    }
    
    // Quality guardian achievement
    if (!achievements.find(a => a.id === 'quality-guardian')) {
      const qualityModules = TIER_MODULES.quality;
      const qualityCompleted = qualityModules.every(mod => 
        progressData[mod]?.completionStatus === 'completed'
      );
      if (qualityCompleted) {
        newAchievements.push(createAchievement('quality-guardian', moduleId));
      }
    }
    
    // Speed learner achievement (5 lessons in one day)
    const today = new Date().toDateString();
    const todaysProgress = Object.values(progressData).filter(p => 
      new Date(p.lastAccessed).toDateString() === today
    );
    const lessonsToday = todaysProgress.reduce((sum, p) => sum + p.lessonsCompleted, 0);
    
    if (lessonsToday >= 5 && !achievements.find(a => a.id === 'speed-learner')) {
      newAchievements.push(createAchievement('speed-learner', moduleId));
    }
    
    // Perfectionist achievement (100% on 10 quizzes)
    if (!achievements.find(a => a.id === 'perfectionist')) {
      const perfectScores = Object.values(progressData).filter(p => p.quizScore === 100);
      if (perfectScores.length >= 10) {
        newAchievements.push(createAchievement('perfectionist', moduleId));
      }
    }
    
    // Streak warrior achievement (7-day streak)
    if (streak.currentStreak >= 7 && !achievements.find(a => a.id === 'streak-warrior')) {
      newAchievements.push(createAchievement('streak-warrior', moduleId));
    }
    
    // Streak legend achievement (30-day streak)
    if (streak.currentStreak >= 30 && !achievements.find(a => a.id === 'streak-legend')) {
      newAchievements.push(createAchievement('streak-legend', moduleId));
    }
    
    // Full stack achievement
    if (!achievements.find(a => a.id === 'full-stack')) {
      const backendModules = ['dotnet-core', 'laravel', 'database'];
      const frontendModules = ['react', 'nextjs'];
      
      const backendCompleted = backendModules.some(mod => 
        progressData[mod]?.completionStatus === 'completed'
      );
      const frontendCompleted = frontendModules.some(mod => 
        progressData[mod]?.completionStatus === 'completed'
      );
      
      if (backendCompleted && frontendCompleted) {
        newAchievements.push(createAchievement('full-stack', moduleId));
      }
    }
    
    if (newAchievements.length > 0) {
      const updatedAchievements = [...achievements, ...newAchievements];
      setAchievements(updatedAchievements);
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(updatedAchievements));
    }
  };

  const calculateOverallProgress = () => {
    const allModules = Object.values(TIER_MODULES).flat();
    const totalModules = allModules.length;
    const completedModules = allModules.filter(moduleId => 
      progress[moduleId]?.completionStatus === 'completed'
    ).length;
    
    return totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  };
  
  const getTierProgress = (tier: 'foundational' | 'core' | 'specialized' | 'quality') => {
    const tierModules = TIER_MODULES[tier];
    const completedInTier = tierModules.filter(moduleId => 
      progress[moduleId]?.completionStatus === 'completed'
    ).length;
    
    return tierModules.length > 0 ? Math.round((completedInTier / tierModules.length) * 100) : 0;
  };

  const getCompletedModulesCount = () => {
    return Object.values(progress).filter(p => p.completionStatus === 'completed').length;
  };

  const getTotalTimeSpent = () => {
    return Object.values(progress).reduce((total, p) => total + p.timeSpent, 0);
  };

  const getAverageQuizScore = () => {
    const scores = Object.values(progress).filter(p => p.quizScore > 0).map(p => p.quizScore);
    return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  };

  const exportProgressData = () => {
    const exportData = {
      progress,
      streak,
      achievements,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `fullstack-progress-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    progress,
    streak,
    achievements,
    updateProgress,
    calculateOverallProgress,
    getTierProgress,
    getCompletedModulesCount,
    getTotalTimeSpent,
    getAverageQuizScore,
    exportProgressData
  };
};