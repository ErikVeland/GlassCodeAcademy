import { useState, useEffect, useCallback } from 'react';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakType: 'daily' | 'weekly' | 'monthly';
  milestones: StreakMilestone[];
  streakHistory: StreakEntry[];
  isActive: boolean;
  nextMilestone?: StreakMilestone;
}

export interface StreakEntry {
  date: string;
  activity: string;
  type: 'lesson' | 'quiz' | 'module_completion' | 'badge_earned';
  points: number;
}

export interface StreakMilestone {
  id: string;
  threshold: number;
  title: string;
  description: string;
  reward: {
    type: 'badge' | 'points' | 'title';
    value: string | number;
  };
  achieved: boolean;
  achievedDate?: string;
}

const STREAK_MILESTONES: StreakMilestone[] = [
  {
    id: 'streak-3',
    threshold: 3,
    title: 'Getting Started',
    description: 'Complete activities for 3 consecutive days',
    reward: { type: 'points', value: 50 },
    achieved: false
  },
  {
    id: 'streak-7',
    threshold: 7,
    title: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    reward: { type: 'badge', value: 'week-warrior' },
    achieved: false
  },
  {
    id: 'streak-14',
    threshold: 14,
    title: 'Fortnight Fighter',
    description: 'Keep learning for 14 consecutive days',
    reward: { type: 'points', value: 200 },
    achieved: false
  },
  {
    id: 'streak-30',
    threshold: 30,
    title: 'Monthly Master',
    description: 'Achieve a 30-day learning streak',
    reward: { type: 'badge', value: 'monthly-master' },
    achieved: false
  },
  {
    id: 'streak-60',
    threshold: 60,
    title: 'Dedication Devotee',
    description: 'Maintain learning habits for 60 days',
    reward: { type: 'title', value: 'Dedicated Learner' },
    achieved: false
  },
  {
    id: 'streak-100',
    threshold: 100,
    title: 'Centurion Scholar',
    description: 'Reach the legendary 100-day streak',
    reward: { type: 'badge', value: 'centurion-scholar' },
    achieved: false
  },
  {
    id: 'streak-365',
    threshold: 365,
    title: 'Year-Round Champion',
    description: 'Complete a full year of consistent learning',
    reward: { type: 'badge', value: 'year-champion' },
    achieved: false
  }
];

const STORAGE_KEY = 'fullstack-academy-streak-data';

export const useStreakTracking = () => {
  const [streakData, setStreakData] = useState<StreakData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          milestones: STREAK_MILESTONES.map(milestone => ({
            ...milestone,
            achieved: parsed.milestones?.find((m: any) => m.id === milestone.id)?.achieved || false,
            achievedDate: parsed.milestones?.find((m: any) => m.id === milestone.id)?.achievedDate
          }))
        };
      } catch (error) {
        console.error('Failed to parse streak data from localStorage:', error);
      }
    }
    
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: '',
      streakType: 'daily',
      milestones: [...STREAK_MILESTONES],
      streakHistory: [],
      isActive: false
    };
  });

  // Save to localStorage whenever streakData changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(streakData));
  }, [streakData]);

  // Check if streak should be broken on component mount
  useEffect(() => {
    checkStreakStatus();
  }, []);

  const isConsecutiveDay = (lastDate: string, currentDate: string): boolean => {
    if (!lastDate) return true;
    
    const last = new Date(lastDate);
    const current = new Date(currentDate);
    const diffTime = Math.abs(current.getTime() - last.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays === 1;
  };

  const isSameDay = (date1: string, date2: string): boolean => {
    return new Date(date1).toDateString() === new Date(date2).toDateString();
  };

  const checkStreakStatus = () => {
    const today = new Date().toISOString().split('T')[0];
    const { lastActivityDate, currentStreak } = streakData;
    
    if (!lastActivityDate) return;
    
    // If it's been more than a day since last activity, break the streak
    if (!isConsecutiveDay(lastActivityDate, today) && !isSameDay(lastActivityDate, today)) {
      setStreakData(prev => ({
        ...prev,
        currentStreak: 0,
        isActive: false
      }));
    }
  };

  const recordActivity = useCallback((activityType: 'lesson' | 'quiz' | 'module_completion' | 'badge_earned', details: string, points: number = 10) => {
    const today = new Date().toISOString().split('T')[0];
    
    setStreakData(prev => {
      const { lastActivityDate, currentStreak, longestStreak, streakHistory } = prev;
      
      // Don't increment streak if activity already recorded today
      if (isSameDay(lastActivityDate, today)) {
        return {
          ...prev,
          streakHistory: [
            ...streakHistory,
            {
              date: today,
              activity: details,
              type: activityType,
              points
            }
          ]
        };
      }
      
      let newStreak = currentStreak;
      
      // Increment streak if consecutive day or first activity
      if (!lastActivityDate || isConsecutiveDay(lastActivityDate, today)) {
        newStreak = currentStreak + 1;
      } else {
        // Reset streak if not consecutive
        newStreak = 1;
      }
      
      const newLongestStreak = Math.max(longestStreak, newStreak);
      
      // Check for milestone achievements
      const updatedMilestones = prev.milestones.map(milestone => {
        if (!milestone.achieved && newStreak >= milestone.threshold) {
          return {
            ...milestone,
            achieved: true,
            achievedDate: today
          };
        }
        return milestone;
      });
      
      // Find next milestone
      const nextMilestone = updatedMilestones.find(m => !m.achieved && m.threshold > newStreak);
      
      return {
        ...prev,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastActivityDate: today,
        isActive: true,
        milestones: updatedMilestones,
        nextMilestone,
        streakHistory: [
          ...streakHistory,
          {
            date: today,
            activity: details,
            type: activityType,
            points
          }
        ]
      };
    });
  }, []);

  const resetStreak = useCallback(() => {
    setStreakData(prev => ({
      ...prev,
      currentStreak: 0,
      isActive: false,
      milestones: STREAK_MILESTONES.map(m => ({ ...m, achieved: false, achievedDate: undefined }))
    }));
  }, []);

  const getStreakStatus = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const { lastActivityDate, currentStreak } = streakData;
    
    if (!lastActivityDate) {
      return { status: 'new', message: 'Start your learning streak today!' };
    }
    
    if (isSameDay(lastActivityDate, today)) {
      return { 
        status: 'active', 
        message: `Great! You're on a ${currentStreak}-day streak. Keep it up!` 
      };
    }
    
    if (isConsecutiveDay(lastActivityDate, today)) {
      return { 
        status: 'pending', 
        message: `Continue your ${currentStreak}-day streak by completing an activity today!` 
      };
    }
    
    return { 
      status: 'broken', 
      message: 'Your streak was broken. Start a new one today!' 
    };
  }, [streakData]);

  const getStreakMotivation = useCallback(() => {
    const { currentStreak, nextMilestone } = streakData;
    
    if (nextMilestone) {
      const remaining = nextMilestone.threshold - currentStreak;
      return `${remaining} more day${remaining === 1 ? '' : 's'} to unlock "${nextMilestone.title}"!`;
    }
    
    if (currentStreak >= 365) {
      return 'You\'re a learning legend! Keep up the incredible work!';
    }
    
    if (currentStreak >= 100) {
      return 'Amazing dedication! You\'re in the top 1% of learners!';
    }
    
    if (currentStreak >= 30) {
      return 'Outstanding commitment! You\'ve built a solid learning habit!';
    }
    
    if (currentStreak >= 7) {
      return 'Great momentum! You\'re building an excellent learning routine!';
    }
    
    return 'Every day counts! Keep building your learning habit!';
  }, [streakData]);

  const getRecentlyAchievedMilestones = useCallback(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return streakData.milestones.filter(milestone => 
      milestone.achieved && 
      milestone.achievedDate && 
      new Date(milestone.achievedDate) >= sevenDaysAgo
    );
  }, [streakData]);

  return {
    streakData,
    recordActivity,
    resetStreak,
    getStreakStatus,
    getStreakMotivation,
    getRecentlyAchievedMilestones,
    checkStreakStatus
  };
};