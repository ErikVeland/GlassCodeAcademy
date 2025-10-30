import { useState, useEffect, useCallback } from 'react';
import { contentRegistry } from '@/lib/contentRegistry';

// Enhanced interfaces matching design documentation
export interface ProgressData {
  moduleId: string;
  moduleName: string;
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
  // Additional tracking fields
  firstAccessed?: string;
  streakDays: number;
  velocity: number; // lessons per day
  masteryLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  activityDates: string[];
  streakHistory: Array<{
    date: string;
    activity: string;
    points: number;
  }>;
  milestones: Array<{
    title: string;
    description: string;
    threshold: number;
    achieved: boolean;
    achievedDate?: string;
  }>;
}

export interface AchievementData {
  id: string;
  title: string;
  icon: string;
  description: string;
  category: 'completion' | 'streak' | 'skill' | 'velocity';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  tier?: 'foundational' | 'core' | 'specialized' | 'quality';
  badgeUrl: string;
  earnedDate: string;
  points: number;
  moduleId?: string;
  unlockCondition: string;
}

export interface UserStats {
  totalStudyTime: number;
  totalLessonsCompleted: number;
  totalQuizzesTaken: number;
  averageQuizScore: number;
  highestStreak: number;
  achievementsUnlocked: number;
  modulesCompleted: number;
  currentTier: string;
  nextTier?: string;
  learningVelocity: number; // modules per week
}

const STORAGE_KEYS = {
  PROGRESS: 'dotnetquiz_progress_complete',
  STREAK: 'dotnetquiz_streak_complete',
  ACHIEVEMENTS: 'dotnetquiz_achievements_complete',
  USER_STATS: 'dotnetquiz_user_stats_complete'
};

// Tier-based module mapping according to design documentation
const TIER_MODULES: Record<'foundational' | 'core' | 'specialized' | 'quality', string[]> = {
  foundational: [
    'programming-fundamentals', 
    'web-fundamentals', 
    'version-control'
  ],
  core: [
    'dotnet', 
    'react', 
    'database-systems', 
    'typescript',
    'node',
    'laravel'
  ],
  specialized: [
    'nextjs', 
    'graphql', 
    'sass',
    'tailwind',
    'vue'
  ],
  quality: [
    'testing-fundamentals', 
    'e2e-testing', 
    'performance-optimization', 
    'security-fundamentals'
  ]
};

// Enhanced achievement definitions with proper metadata
const ACHIEVEMENT_DEFINITIONS: Record<string, Omit<AchievementData, 'earnedDate' | 'moduleId'>> = {
  'first-lesson': {
    id: 'first-lesson',
    title: 'First Steps',
    icon: '👶',
    description: 'Completed your first lesson',
    category: 'velocity',
    rarity: 'common',
    badgeUrl: '/badges/first-lesson.svg',
    points: 10,
    unlockCondition: 'Complete any lesson'
  },
  'foundation-master': {
    id: 'foundation-master',
    title: 'Foundation Master',
    icon: '🎓',
    description: 'Master of foundational concepts',
    category: 'completion',
    rarity: 'uncommon',
    tier: 'foundational',
    badgeUrl: '/badges/foundation-master.svg',
    points: 50,
    unlockCondition: 'Complete Foundational Tier'
  },
  'core-developer': {
    id: 'core-developer',
    title: 'Core Developer',
    icon: '⚙️',
    description: 'Core technologies specialist',
    category: 'completion',
    rarity: 'uncommon',
    tier: 'core',
    badgeUrl: '/badges/core-developer.svg',
    points: 100,
    unlockCondition: 'Complete Core Technologies Tier'
  },
  'specialist': {
    id: 'specialist',
    title: 'Specialist',
    icon: '💎',
    description: 'Advanced skills specialist',
    category: 'completion',
    rarity: 'rare',
    tier: 'specialized',
    badgeUrl: '/badges/specialist.svg',
    points: 200,
    unlockCondition: 'Complete Specialised Skills Tier'
  },
  'quality-guardian': {
    id: 'quality-guardian',
    title: 'Quality Guardian',
    icon: '🛡️',
    description: 'Quality and testing expert',
    category: 'completion',
    rarity: 'epic',
    tier: 'quality',
    badgeUrl: '/badges/quality-guardian.svg',
    points: 300,
    unlockCondition: 'Complete Quality & Testing Tier'
  },
  'speed-learner': {
    id: 'speed-learner',
    title: 'Speed Learner',
    icon: '⚡',
    description: 'Completed 5 lessons in one day',
    category: 'velocity',
    rarity: 'rare',
    badgeUrl: '/badges/speed-learner.svg',
    points: 75,
    unlockCondition: '5 lessons in one day'
  },
  'perfectionist': {
    id: 'perfectionist',
    title: 'Perfectionist',
    icon: '💯',
    description: 'Achieved perfect scores on 10 quizzes',
    category: 'skill',
    rarity: 'epic',
    badgeUrl: '/badges/perfectionist.svg',
    points: 150,
    unlockCondition: '100% on 10 quizzes'
  },
  'streak-warrior': {
    id: 'streak-warrior',
    title: 'Streak Warrior',
    icon: '🔥',
    description: 'Maintained a 7-day learning streak',
    category: 'streak',
    rarity: 'epic',
    badgeUrl: '/badges/streak-warrior.svg',
    points: 100,
    unlockCondition: '7-day learning streak'
  },
  'streak-legend': {
    id: 'streak-legend',
    title: 'Streak Legend',
    icon: '🌟',
    description: 'Maintained a 30-day learning streak',
    category: 'streak',
    rarity: 'legendary',
    badgeUrl: '/badges/streak-legend.svg',
    points: 500,
    unlockCondition: '30-day learning streak'
  },
  'full-stack': {
    id: 'full-stack',
    title: 'Full Stack Developer',
    icon: '🚀',
    description: 'Completed both frontend and backend modules',
    category: 'skill',
    rarity: 'legendary',
    badgeUrl: '/badges/full-stack.svg',
    points: 1000,
    unlockCondition: 'Master both frontend and backend'
  },
  'quiz-master': {
    id: 'quiz-master',
    title: 'Quiz Master',
    icon: '🧠',
    description: 'Achieved 90%+ on 20 quizzes',
    category: 'skill',
    rarity: 'epic',
    badgeUrl: '/badges/quiz-master.svg',
    points: 200,
    unlockCondition: '90%+ on 20 quizzes'
  },
  'consistent-learner': {
    id: 'consistent-learner',
    title: 'Consistent Learner',
    icon: '📅',
    description: 'Studied for 30 consecutive days',
    category: 'streak',
    rarity: 'legendary',
    badgeUrl: '/badges/consistent-learner.svg',
    points: 300,
    unlockCondition: '30 consecutive days of learning'
  }
};

// Streak milestones
const STREAK_MILESTONES = [
  { title: 'Beginner', description: '3-day streak', threshold: 3, achieved: false, achievedDate: undefined },
  { title: 'Regular', description: '7-day streak', threshold: 7, achieved: false, achievedDate: undefined },
  { title: 'Dedicated', description: '14-day streak', threshold: 14, achieved: false, achievedDate: undefined },
  { title: 'Committed', description: '30-day streak', threshold: 30, achieved: false, achievedDate: undefined },
  { title: 'Legend', description: '90-day streak', threshold: 90, achieved: false, achievedDate: undefined }
];

export const useProgressTrackingComplete = () => {
  const [progress, setProgress] = useState<Record<string, ProgressData>>({});
  const [tierModuleCache, setTierModuleCache] = useState<Record<string, string[]>>({});
  const [lessonCountCache, setLessonCountCache] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    activityDates: [],
    streakHistory: [],
    milestones: STREAK_MILESTONES
  });
  const [achievements, setAchievements] = useState<AchievementData[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalStudyTime: 0,
    totalLessonsCompleted: 0,
    totalQuizzesTaken: 0,
    averageQuizScore: 0,
    highestStreak: 0,
    achievementsUnlocked: 0,
    modulesCompleted: 0,
    currentTier: 'foundational',
    learningVelocity: 0
  });

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

      const savedUserStats = localStorage.getItem(STORAGE_KEYS.USER_STATS);
      if (savedUserStats) {
        setUserStats(JSON.parse(savedUserStats));
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  }, []);

  // Normalize module items into slug list
  const normalizeModuleSlugs = (items: unknown[]): string[] => {
    return items
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const obj = item as { slug?: string; id?: string };
          return obj.slug ?? obj.id ?? '';
        }
        return '';
      })
      .filter((s): s is string => Boolean(s));
  };

  // Load content registry and build caches (tier modules and lesson counts)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await contentRegistry.loadRegistry();

        const tierMap: Record<string, string[]> = {};
        const lessonCounts: Record<string, number> = {};

        // Default slugs; attempt to read from registry if available
        let tierSlugs: Array<'foundational' | 'core' | 'specialized' | 'quality'> = [
          'foundational',
          'core',
          'specialized',
          'quality'
        ];

        try {
          const tiersRecord = await contentRegistry.getTiers();
          const candidateSlugs = Object.keys(tiersRecord);
          const validSlugs = candidateSlugs.filter((s) =>
            s === 'foundational' || s === 'core' || s === 'specialized' || s === 'quality'
          ) as Array<'foundational' | 'core' | 'specialized' | 'quality'>;
          if (validSlugs.length) tierSlugs = validSlugs;
        } catch {
          // Keep defaults on failure
        }

        for (const tierSlug of tierSlugs) {
          let mods: unknown[] = [];
          try {
            mods = await contentRegistry.getModulesByTier(tierSlug);
          } catch {
            mods = (TIER_MODULES[tierSlug] || []) as unknown[];
          }
          const moduleSlugs = normalizeModuleSlugs(mods);
          tierMap[tierSlug] = moduleSlugs;

          // Populate lesson counts per module
          for (const modSlug of moduleSlugs) {
            try {
              const lessons = await contentRegistry.getModuleLessons(modSlug);
              lessonCounts[modSlug] = Array.isArray(lessons) ? lessons.length : (lessonCounts[modSlug] || 0);
            } catch {
              // Leave default if registry fails
              lessonCounts[modSlug] = lessonCounts[modSlug] ?? 0;
            }
          }
        }

        if (!mounted) return;
        setTierModuleCache(tierMap);
        setLessonCountCache(lessonCounts);
      } catch (err) {
        console.warn('Content registry not available, using fallback TIER_MODULES:', err);
        if (!mounted) return;
        // Fallback to static mapping
        setTierModuleCache(TIER_MODULES as Record<string, string[]>);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Helper: determine tier for a module via registry-backed cache with fallback
  const resolveTierForModule = useCallback(async (
    moduleId: string
  ): Promise<'foundational' | 'core' | 'specialized' | 'quality'> => {
    const source = Object.keys(tierModuleCache).length ? tierModuleCache : (TIER_MODULES as Record<string, string[]>);
    
    // First try with the moduleId as-is
    let found = Object.entries(source).find(([, mods]) => mods.includes(moduleId))?.[0];
    
    // If not found, try converting between shortSlug and moduleSlug
    if (!found) {
      try {
        // Try converting shortSlug to moduleSlug
        const moduleSlug = await contentRegistry.getModuleSlugFromShortSlug(moduleId);
        if (moduleSlug) {
          found = Object.entries(source).find(([, mods]) => mods.includes(moduleSlug))?.[0];
        }
        
        // If still not found, try converting moduleSlug to shortSlug
        if (!found) {
          const shortSlug = await contentRegistry.getShortSlugFromModuleSlug(moduleId);
          if (shortSlug) {
            found = Object.entries(source).find(([, mods]) => mods.includes(shortSlug))?.[0];
          }
        }
      } catch (error) {
        console.warn('Error resolving tier for module:', moduleId, error);
      }
    }
    
    return (found || 'foundational') as 'foundational' | 'core' | 'specialized' | 'quality';
  }, [tierModuleCache]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving progress data:', error);
    }
  }, [progress]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(streak));
    } catch (error) {
      console.error('Error saving streak data:', error);
    }
  }, [streak]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
    } catch (error) {
      console.error('Error saving achievements data:', error);
    }
  }, [achievements]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(userStats));
    } catch (error) {
      console.error('Error saving user stats data:', error);
    }
  }, [userStats]);

  // Helper function to get actual lesson count from content files (registry-backed with fallback)
  const getActualLessonCount = useCallback(async (moduleId: string): Promise<number> => {
    // Try to get from cache using the provided moduleId (could be shortSlug or moduleSlug)
    let fromCache = lessonCountCache[moduleId];
    if (typeof fromCache === 'number' && fromCache > 0) return fromCache;
    
    // If not found, try to convert between shortSlug and moduleSlug
    try {
      // Try as shortSlug first
      const moduleSlugFromShort = await contentRegistry.getModuleSlugFromShortSlug(moduleId);
      if (moduleSlugFromShort && lessonCountCache[moduleSlugFromShort]) {
        fromCache = lessonCountCache[moduleSlugFromShort];
        if (typeof fromCache === 'number' && fromCache > 0) return fromCache;
      }
      
      // Try as moduleSlug
      const shortSlugFromModule = await contentRegistry.getShortSlugFromModuleSlug(moduleId);
      if (shortSlugFromModule && lessonCountCache[shortSlugFromModule]) {
        fromCache = lessonCountCache[shortSlugFromModule];
        if (typeof fromCache === 'number' && fromCache > 0) return fromCache;
      }
    } catch (error) {
      console.warn('Error converting between shortSlug and moduleSlug:', error);
    }
    
    const tier = await resolveTierForModule(moduleId) as 'foundational' | 'core' | 'specialized' | 'quality';
    const defaultCounts: Record<'foundational' | 'core' | 'specialized' | 'quality', number> = {
      foundational: 12,
      core: 15,
      specialized: 14,
      quality: 12
    };
    return defaultCounts[tier] || 12;
  }, [lessonCountCache, resolveTierForModule]);

  const updateStreak = useCallback((moduleId: string, lessonsCompleted: number) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    const updatedStreak = { ...streak };
    
    if (streak.lastActiveDate !== today) {
      // Add today to activity dates
      const newActivityDates = [...streak.activityDates, today];
      
      // Add to streak history
      const activityEntry = {
        date: today,
        activity: lessonsCompleted > 0 ? `Completed ${lessonsCompleted} lessons in ${moduleId}` : `Accessed ${moduleId}`,
        points: lessonsCompleted > 0 ? lessonsCompleted * 10 : 5
      };
      
      updatedStreak.streakHistory = [...streak.streakHistory, activityEntry].slice(-100); // Keep last 100 activities
      
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
      
      // Update milestones
      updatedStreak.milestones = STREAK_MILESTONES.map(milestone => ({
        ...milestone,
        achieved: updatedStreak.currentStreak >= milestone.threshold,
        achievedDate: updatedStreak.currentStreak >= milestone.threshold && !milestone.achieved ? 
          new Date().toISOString() : milestone.achievedDate
      }));
      
      setStreak(updatedStreak);
    }
  }, [streak]);

  const checkAchievements = useCallback(async (progressData: Record<string, ProgressData>, moduleId: string) => {
    const newAchievements: AchievementData[] = [];
    const currentTime = new Date().toISOString();
    
    // Helper function to create achievement
    const createAchievement = (id: string, moduleId?: string): AchievementData | null => {
      const definition = ACHIEVEMENT_DEFINITIONS[id];
      if (!definition) return null;
      
      // Check if already earned
      if (achievements.find(a => a.id === id)) return null;
      
      return {
        ...definition,
        earnedDate: currentTime,
        moduleId
      };
    };
    
    // First lesson achievement
    const firstLessonAchievement = createAchievement('first-lesson', moduleId);
    if (firstLessonAchievement) {
      const hasCompletedLesson = Object.values(progressData).some(p => p.lessonsCompleted > 0);
      if (hasCompletedLesson) {
        newAchievements.push(firstLessonAchievement);
      }
    }
    
    // Tier completion achievements
    const foundationMasterAchievement = createAchievement('foundation-master', moduleId);
    if (foundationMasterAchievement) {
      const foundationalModules = (tierModuleCache.foundational || TIER_MODULES.foundational);
      const foundationCompleted = foundationalModules.every(mod => 
        progressData[mod]?.completionStatus === 'completed'
      );
      if (foundationCompleted) {
        newAchievements.push(foundationMasterAchievement);
      }
    }
    
    const coreDeveloperAchievement = createAchievement('core-developer', moduleId);
    if (coreDeveloperAchievement) {
      const coreModules = (tierModuleCache.core || TIER_MODULES.core);
      const coreCompleted = coreModules.every(mod => 
        progressData[mod]?.completionStatus === 'completed'
      );
      if (coreCompleted) {
        newAchievements.push(coreDeveloperAchievement);
      }
    }
    
    const specialistAchievement = createAchievement('specialist', moduleId);
    if (specialistAchievement) {
      const specializedModules = (tierModuleCache.specialized || TIER_MODULES.specialized);
      const specializedCompleted = specializedModules.every(mod => 
        progressData[mod]?.completionStatus === 'completed'
      );
      if (specializedCompleted) {
        newAchievements.push(specialistAchievement);
      }
    }
    
    const qualityGuardianAchievement = createAchievement('quality-guardian', moduleId);
    if (qualityGuardianAchievement) {
      const qualityModules = (tierModuleCache.quality || TIER_MODULES.quality);
      const qualityCompleted = qualityModules.every(mod => 
        progressData[mod]?.completionStatus === 'completed'
      );
      if (qualityCompleted) {
        newAchievements.push(qualityGuardianAchievement);
      }
    }
    
    // Speed learner achievement (5 lessons in one day)
    const speedLearnerAchievement = createAchievement('speed-learner', moduleId);
    if (speedLearnerAchievement) {
      const today = new Date().toDateString();
      const todaysProgress = Object.values(progressData).filter(p => 
        new Date(p.lastAccessed).toDateString() === today
      );
      const lessonsToday = todaysProgress.reduce((sum, p) => sum + p.lessonsCompleted, 0);
      
      if (lessonsToday >= 5) {
        newAchievements.push(speedLearnerAchievement);
      }
    }
    
    // Perfectionist achievement (100% on 10 quizzes)
    const perfectionistAchievement = createAchievement('perfectionist', moduleId);
    if (perfectionistAchievement) {
      const perfectScores = Object.values(progressData).filter(p => p.quizScore === 100);
      if (perfectScores.length >= 10) {
        newAchievements.push(perfectionistAchievement);
      }
    }
    
    // Quiz master achievement (90%+ on 20 quizzes)
    const quizMasterAchievement = createAchievement('quiz-master', moduleId);
    if (quizMasterAchievement) {
      const highScores = Object.values(progressData).filter(p => p.quizScore >= 90);
      if (highScores.length >= 20) {
        newAchievements.push(quizMasterAchievement);
      }
    }
    
    // Streak achievements
    const streakWarriorAchievement = createAchievement('streak-warrior', moduleId);
    if (streakWarriorAchievement && streak.currentStreak >= 7) {
      newAchievements.push(streakWarriorAchievement);
    }
    
    const streakLegendAchievement = createAchievement('streak-legend', moduleId);
    if (streakLegendAchievement && streak.currentStreak >= 30) {
      newAchievements.push(streakLegendAchievement);
    }
    
    const consistentLearnerAchievement = createAchievement('consistent-learner', moduleId);
    if (consistentLearnerAchievement && streak.currentStreak >= 30) {
      newAchievements.push(consistentLearnerAchievement);
    }
    
    // Full stack achievement
    const fullStackAchievement = createAchievement('full-stack', moduleId);
    if (fullStackAchievement) {
      // Try registry tracks first, fallback to static lists
      let backendTrackItems: unknown[] = [];
      let frontendTrackItems: unknown[] = [];
      try {
        backendTrackItems = await contentRegistry.getModulesByTrack('backend');
      } catch {
        backendTrackItems = ['dotnet', 'laravel', 'database-systems'];
      }
      try {
        frontendTrackItems = await contentRegistry.getModulesByTrack('frontend');
      } catch {
        frontendTrackItems = ['react', 'nextjs', 'vue'];
      }

      const backendModules = normalizeModuleSlugs(backendTrackItems);
      const frontendModules = normalizeModuleSlugs(frontendTrackItems);

      const backendCompleted = backendModules.some((mod) =>
        progressData[mod]?.completionStatus === 'completed'
      );
      const frontendCompleted = frontendModules.some((mod) =>
        progressData[mod]?.completionStatus === 'completed'
      );

      if (backendCompleted && frontendCompleted) {
        newAchievements.push(fullStackAchievement);
      }
    }
    
    if (newAchievements.length > 0) {
      const updatedAchievements = [...achievements, ...newAchievements];
      setAchievements(updatedAchievements);
    }
  }, [achievements, tierModuleCache, streak]);

  const updateUserStats = useCallback((progressData: Record<string, ProgressData>) => {
    const totalStudyTime = Object.values(progressData).reduce((sum, p) => sum + p.timeSpent, 0);
    const totalLessonsCompleted = Object.values(progressData).reduce((sum, p) => sum + p.lessonsCompleted, 0);
    const quizzesTaken = Object.values(progressData).filter(p => p.quizScore > 0).length;
    const quizScores = Object.values(progressData).filter(p => p.quizScore > 0).map(p => p.quizScore);
    const averageQuizScore = quizScores.length > 0 ? 
      Math.round(quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length) : 0;
    const modulesCompleted = Object.values(progressData).filter(p => p.completionStatus === 'completed').length;
    
    // Calculate learning velocity (modules per week)
    const firstAccessDates = Object.values(progressData)
      .filter(p => p.firstAccessed)
      .map(p => new Date(p.firstAccessed!));
    
    let learningVelocity = 0;
    if (firstAccessDates.length > 0) {
      const earliestDate = new Date(Math.min(...firstAccessDates.map(d => d.getTime())));
      const weeksSinceStart = (Date.now() - earliestDate.getTime()) / (7 * 24 * 60 * 60 * 1000);
      learningVelocity = weeksSinceStart > 0 ? modulesCompleted / weeksSinceStart : 0;
    }
    
    // Determine current tier based on completion
    let currentTier: 'foundational' | 'core' | 'specialized' | 'quality' = 'foundational';
    if (modulesCompleted > 0) {
      const source = Object.keys(tierModuleCache).length ? tierModuleCache : (TIER_MODULES as Record<string, string[]>);
      const foundationalComplete = (source.foundational || []).every(mod => progressData[mod]?.completionStatus === 'completed');
      const coreComplete = (source.core || []).every(mod => progressData[mod]?.completionStatus === 'completed');
      const specializedComplete = (source.specialized || []).every(mod => progressData[mod]?.completionStatus === 'completed');
      if (specializedComplete) {
        currentTier = 'quality';
      } else if (coreComplete) {
        currentTier = 'specialized';
      } else if (foundationalComplete) {
        currentTier = 'core';
      }
    }
    
    const updatedStats: UserStats = {
      totalStudyTime,
      totalLessonsCompleted,
      totalQuizzesTaken: quizzesTaken,
      averageQuizScore,
      highestStreak: streak.longestStreak,
      achievementsUnlocked: achievements.length,
      modulesCompleted,
      currentTier,
      learningVelocity
    };
    
    setUserStats(updatedStats);
  }, [achievements, streak, tierModuleCache]);

  const updateProgress = useCallback(async (
    moduleId: string,
    dataOrName: string | Partial<ProgressData>,
    maybeData?: Partial<ProgressData>
  ) => {
    const currentTime = new Date().toISOString();
    const data: Partial<ProgressData> = typeof dataOrName === 'string' ? (maybeData ?? {}) : (dataOrName as Partial<ProgressData>);
    const resolvedModuleName = typeof dataOrName === 'string'
      ? dataOrName
      : (progress[moduleId]?.moduleName ?? moduleId);
    
    // Determine tier for module using registry-backed cache
    const tier = await resolveTierForModule(moduleId);
    
    // Get actual lesson count from content files
    const actualLessonCount = await getActualLessonCount(moduleId);
    
    const defaultProgressData: ProgressData = {
      moduleId,
      moduleName: resolvedModuleName,
      lessonsCompleted: 0,
      totalLessons: actualLessonCount,
      quizScore: 0,
      timeSpent: 0,
      lastAccessed: currentTime,
      completionStatus: 'not-started',
      badges: [],
      completedTopics: [],
      tier,
      streakDays: 0,
      velocity: 0,
      masteryLevel: 'beginner'
    };
    
    const currentProgress = progress[moduleId] || defaultProgressData;
    
    const updatedProgress: ProgressData = {
      ...currentProgress,
      ...data,
      lastAccessed: currentTime,
      firstAccessed: currentProgress.firstAccessed || currentTime
    };
    
    // Auto-calculate completion status
    if (updatedProgress.lessonsCompleted >= updatedProgress.totalLessons && 
        updatedProgress.quizScore >= 70) {
      updatedProgress.completionStatus = 'completed';
    } else if (updatedProgress.lessonsCompleted > 0 || updatedProgress.quizScore > 0) {
      updatedProgress.completionStatus = 'in-progress';
    }
    
    // Calculate mastery level based on progress
    const progressPercentage = updatedProgress.totalLessons > 0 ? 
      (updatedProgress.lessonsCompleted / updatedProgress.totalLessons) * 100 : 0;
    
    if (progressPercentage >= 90) {
      updatedProgress.masteryLevel = 'expert';
    } else if (progressPercentage >= 70) {
      updatedProgress.masteryLevel = 'advanced';
    } else if (progressPercentage >= 50) {
      updatedProgress.masteryLevel = 'intermediate';
    }
    
    // Update streak and achievements
    const updated = {
      ...progress,
      [moduleId]: updatedProgress
    };
    
    setProgress(updated);
    
    // Update streak
    updateStreak(moduleId, (data as Partial<ProgressData>).lessonsCompleted || 0);
    
    // Check for new achievements
    void checkAchievements(updated, moduleId);
    
    // Update user stats
    updateUserStats(updated);
  }, [progress, resolveTierForModule, getActualLessonCount, updateStreak, checkAchievements, updateUserStats]);

  const calculateOverallProgress = () => {
    const source = Object.keys(tierModuleCache).length ? tierModuleCache : (TIER_MODULES as Record<string, string[]>);
    const allModules = Object.values(source).flat();
    const totalModules = allModules.length;
    const completedModules = allModules.filter(moduleId => 
      progress[moduleId]?.completionStatus === 'completed'
    ).length;
    
    return totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  };
  
  const getTierProgress = (tier: 'foundational' | 'core' | 'specialized' | 'quality') => {
    const source = Object.keys(tierModuleCache).length ? tierModuleCache : (TIER_MODULES as Record<string, string[]>);
    const tierModules = source[tier] || [];
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

  const getRecentAchievements = (count = 5) => {
    return [...achievements]
      .sort((a, b) => new Date(b.earnedDate).getTime() - new Date(a.earnedDate).getTime())
      .slice(0, count);
  };

  const getUserStats = (): UserStats => {
    return userStats;
  };

  const getAllProgress = () => {
    return progress;
  };

  const getStreakStatus = () => {
    if (streak.currentStreak === 0) {
      return { status: 'inactive', message: 'Start learning to build your streak!' };
    } else if (streak.currentStreak === 1) {
      return { status: 'new', message: 'Great start! Keep going tomorrow to build your streak.' };
    } else if (streak.currentStreak < 7) {
      return { status: 'building', message: `${7 - streak.currentStreak} days to reach your next milestone!` };
    } else if (streak.currentStreak < 30) {
      return { status: 'strong', message: `🔥 ${streak.currentStreak} day streak! You're on fire!` };
    } else {
      return { status: 'legendary', message: `🌟 ${streak.currentStreak} day streak! You're a learning legend!` };
    }
  };

  const getStreakMotivation = () => {
    const messages = [
      "Consistency is key to mastery!",
      "Every day you learn, you're building your future!",
      "Small daily progress leads to big results!",
      "Your future self will thank you for today's effort!",
      "Learning is the best investment in yourself!",
      "Keep going - you're building unstoppable momentum!",
      "Each lesson brings you closer to your goals!",
      "Progress, not perfection!",
      "You're developing skills that will last a lifetime!",
      "Every expert was once a beginner who kept going!"
    ];
    // Deterministic selection based on streak state to avoid SSR/client mismatch
    const seed = (streak.currentStreak || 0) + (streak.longestStreak || 0);
    const index = Math.abs(seed) % messages.length;
    return messages[index];
  };

  const exportProgressData = () => {
    const exportData = {
      progress,
      streak,
      achievements,
      userStats,
      exportedAt: new Date().toISOString(),
      version: '2.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `dotnetquiz-progress-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importProgressData = (data: string) => {
    try {
      const importedData = JSON.parse(data);
      
      if (importedData.progress) setProgress(importedData.progress);
      if (importedData.streak) setStreak(importedData.streak);
      if (importedData.achievements) setAchievements(importedData.achievements);
      if (importedData.userStats) setUserStats(importedData.userStats);
      
      return { success: true, message: 'Progress data imported successfully!' };
    } catch (error) {
      console.error('Error importing progress data:', error);
      return { success: false, message: 'Failed to import progress data. Please check the file format.' };
    }
  };

  return {
    // Progress data
    progress,
    streak,
    achievements,
    userStats,
    
    // Core functions
    updateProgress,
    calculateOverallProgress,
    getTierProgress,
    getCompletedModulesCount,
    getTotalTimeSpent,
    getAverageQuizScore,
    
    // Helper functions
    getAllProgress,
    getUserStats,
    getRecentAchievements,
    getStreakStatus,
    getStreakMotivation,
    
    // Export/Import
    exportProgressData,
    importProgressData
  };
};