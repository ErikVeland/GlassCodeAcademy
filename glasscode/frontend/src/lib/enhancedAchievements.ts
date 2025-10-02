// Enhanced Achievement System with Comprehensive Badge Recognition
// This extends the existing achievement system with more detailed milestones

export interface ExtendedAchievement {
  id: string;
  category: 'completion' | 'streak' | 'skill' | 'velocity' | 'mastery' | 'exploration' | 'community';
  title: string;
  description: string;
  iconUrl: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
  tier?: 'foundational' | 'core' | 'specialized' | 'quality';
  requirements: {
    type: 'module_completion' | 'quiz_score' | 'streak_days' | 'time_spent' | 'lesson_count' | 'tier_completion';
    target: number;
    condition?: 'exact' | 'minimum' | 'maximum';
  }[];
  unlocked: boolean;
  earnedDate?: string;
  progress: number; // 0-100 percentage
}

export const ENHANCED_ACHIEVEMENTS: Record<string, ExtendedAchievement> = {
  // Completion Achievements
  'first-steps': {
    id: 'first-steps',
    category: 'completion',
    title: 'First Steps',
    description: 'Complete your first lesson',
    iconUrl: '/badges/first-steps.svg',
    rarity: 'common',
    points: 10,
    requirements: [
      { type: 'lesson_count', target: 1, condition: 'minimum' }
    ],
    unlocked: false,
    progress: 0
  },
  
  'getting-started': {
    id: 'getting-started',
    category: 'completion',
    title: 'Getting Started',
    description: 'Complete 5 lessons across any modules',
    iconUrl: '/badges/getting-started.svg',
    rarity: 'common',
    points: 25,
    requirements: [
      { type: 'lesson_count', target: 5, condition: 'minimum' }
    ],
    unlocked: false,
    progress: 0
  },

  'foundation-builder': {
    id: 'foundation-builder',
    category: 'completion',
    title: 'Foundation Builder',
    description: 'Complete all foundational tier modules',
    iconUrl: '/badges/foundation-builder.svg',
    rarity: 'uncommon',
    points: 100,
    tier: 'foundational',
    requirements: [
      { type: 'tier_completion', target: 100, condition: 'minimum' }
    ],
    unlocked: false,
    progress: 0
  },

  'core-developer': {
    id: 'core-developer',
    category: 'completion',
    title: 'Core Developer',
    description: 'Master all core technology modules',
    iconUrl: '/badges/core-developer.svg',
    rarity: 'rare',
    points: 250,
    tier: 'core',
    requirements: [
      { type: 'tier_completion', target: 100, condition: 'minimum' }
    ],
    unlocked: false,
    progress: 0
  },

  'specialist': {
    id: 'specialist',
    category: 'mastery',
    title: 'Technical Specialist',
    description: 'Complete all specialized skill modules',
    iconUrl: '/badges/specialist.svg',
    rarity: 'epic',
    points: 500,
    tier: 'specialized',
    requirements: [
      { type: 'tier_completion', target: 100, condition: 'minimum' }
    ],
    unlocked: false,
    progress: 0
  },

  'quality-guardian': {
    id: 'quality-guardian',
    category: 'mastery',
    title: 'Quality Guardian',
    description: 'Master all quality and testing modules',
    iconUrl: '/badges/quality-guardian.svg',
    rarity: 'epic',
    points: 400,
    tier: 'quality',
    requirements: [
      { type: 'tier_completion', target: 100, condition: 'minimum' }
    ],
    unlocked: false,
    progress: 0
  },

  'fullstack-master': {
    id: 'fullstack-master',
    category: 'mastery',
    title: 'Fullstack Master',
    description: 'Complete ALL modules across all tiers',
    iconUrl: '/badges/fullstack-master.svg',
    rarity: 'legendary',
    points: 1000,
    requirements: [
      { type: 'module_completion', target: 18, condition: 'minimum' }
    ],
    unlocked: false,
    progress: 0
  },

  // Skill Achievement
  'perfectionist': {
    id: 'perfectionist',
    category: 'skill',
    title: 'Perfectionist',
    description: 'Score 100% on 5 different quizzes',
    iconUrl: '/badges/perfectionist.svg',
    rarity: 'rare',
    points: 200,
    requirements: [
      { type: 'quiz_score', target: 100, condition: 'minimum' }
    ],
    unlocked: false,
    progress: 0
  },

  'quiz-master': {
    id: 'quiz-master',
    category: 'skill',
    title: 'Quiz Master',
    description: 'Score above 90% on 10 different quizzes',
    iconUrl: '/badges/quiz-master.svg',
    rarity: 'epic',
    points: 350,
    requirements: [
      { type: 'quiz_score', target: 90, condition: 'minimum' }
    ],
    unlocked: false,
    progress: 0
  },

  // Streak Achievements
  'consistent-learner': {
    id: 'consistent-learner',
    category: 'streak',
    title: 'Consistent Learner',
    description: 'Maintain a 3-day learning streak',
    iconUrl: '/badges/consistent-learner.svg',
    rarity: 'common',
    points: 30,
    requirements: [
      { type: 'streak_days', target: 3, condition: 'minimum' }
    ],
    unlocked: false,
    progress: 0
  },

  'dedicated-student': {
    id: 'dedicated-student',
    category: 'streak',
    title: 'Dedicated Student',
    description: 'Maintain a 7-day learning streak',
    iconUrl: '/badges/dedicated-student.svg',
    rarity: 'uncommon',
    points: 75,
    requirements: [
      { type: 'streak_days', target: 7, condition: 'minimum' }
    ],
    unlocked: false,
    progress: 0
  },

  'streak-warrior': {
    id: 'streak-warrior',
    category: 'streak',
    title: 'Streak Warrior',
    description: 'Maintain a 14-day learning streak',
    iconUrl: '/badges/streak-warrior.svg',
    rarity: 'rare',
    points: 150,
    requirements: [
      { type: 'streak_days', target: 14, condition: 'minimum' }
    ],
    unlocked: false,
    progress: 0
  },

  'streak-legend': {
    id: 'streak-legend',
    category: 'streak',
    title: 'Streak Legend',
    description: 'Maintain a 30-day learning streak',
    iconUrl: '/badges/streak-legend.svg',
    rarity: 'epic',
    points: 300,
    requirements: [
      { type: 'streak_days', target: 30, condition: 'minimum' }
    ],
    unlocked: false,
    progress: 0
  },

  'unstoppable': {
    id: 'unstoppable',
    category: 'streak',
    title: 'Unstoppable',
    description: 'Maintain a 100-day learning streak',
    iconUrl: '/badges/unstoppable.svg',
    rarity: 'legendary',
    points: 1000,
    requirements: [
      { type: 'streak_days', target: 100, condition: 'minimum' }
    ],
    unlocked: false,
    progress: 0
  },

  // Velocity Achievements
  'speed-learner': {
    id: 'speed-learner',
    category: 'velocity',
    title: 'Speed Learner',
    description: 'Complete 5 lessons in a single day',
    iconUrl: '/badges/speed-learner.svg',
    rarity: 'uncommon',
    points: 50,
    requirements: [
      { type: 'lesson_count', target: 5, condition: 'minimum' }
    ],
    unlocked: false,
    progress: 0
  },

  'marathon-runner': {
    id: 'marathon-runner',
    category: 'velocity',
    title: 'Marathon Runner',
    description: 'Spend 8+ hours learning in a single week',
    iconUrl: '/badges/marathon-runner.svg',
    rarity: 'rare',
    points: 200,
    requirements: [
      { type: 'time_spent', target: 480, condition: 'minimum' } // 8 hours in minutes
    ],
    unlocked: false,
    progress: 0
  },

  // Exploration Achievements
  'explorer': {
    id: 'explorer',
    category: 'exploration',
    title: 'Explorer',
    description: 'Start lessons in all 4 tiers',
    iconUrl: '/badges/explorer.svg',
    rarity: 'uncommon',
    points: 100,
    requirements: [
      { type: 'tier_completion', target: 1, condition: 'minimum' }
    ],
    unlocked: false,
    progress: 0
  },

  'polyglot': {
    id: 'polyglot',
    category: 'exploration',
    title: 'Polyglot',
    description: 'Complete modules in 3 different technology categories',
    iconUrl: '/badges/polyglot.svg',
    rarity: 'rare',
    points: 300,
    requirements: [
      { type: 'module_completion', target: 3, condition: 'minimum' }
    ],
    unlocked: false,
    progress: 0
  }
};

// Badge tier colors and styling
export const RARITY_STYLES = {
  common: {
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-700',
    glowColor: 'shadow-gray-200'
  },
  uncommon: {
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    textColor: 'text-green-700',
    glowColor: 'shadow-green-200'
  },
  rare: {
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-700',
    glowColor: 'shadow-blue-200'
  },
  epic: {
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-700',
    glowColor: 'shadow-purple-200'
  },
  legendary: {
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    textColor: 'text-yellow-700',
    glowColor: 'shadow-yellow-200'
  }
};

// Achievement progress calculation utility
export const calculateAchievementProgress = (
  achievement: ExtendedAchievement,
  userProgress: any
): number => {
  // This would calculate actual progress based on user data
  // Implementation would depend on the specific requirement type
  return 0; // Placeholder
};