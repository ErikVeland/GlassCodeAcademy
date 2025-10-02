import { useState, useEffect, useCallback } from 'react';
import { ENHANCED_ACHIEVEMENTS, ExtendedAchievement } from '../lib/enhancedAchievements';

interface UserAchievement extends ExtendedAchievement {
  earned: boolean;
  earnedDate?: string;
  progress: number;
}

interface AchievementProgress {
  [achievementId: string]: {
    current: number;
    target: number;
    percentage: number;
  };
}

const STORAGE_KEY = 'fullstack-academy-achievements';

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<UserAchievement[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return Object.values(ENHANCED_ACHIEVEMENTS).map(achievement => ({
          ...achievement,
          earned: parsed[achievement.id]?.earned || false,
          earnedDate: parsed[achievement.id]?.earnedDate,
          progress: parsed[achievement.id]?.progress || 0
        }));
      } catch (error) {
        console.error('Failed to parse achievements from localStorage:', error);
      }
    }
    
    return Object.values(ENHANCED_ACHIEVEMENTS).map(achievement => ({
      ...achievement,
      earned: false,
      progress: 0
    }));
  });

  // Save to localStorage whenever achievements change
  useEffect(() => {
    const achievementData = achievements.reduce((acc, achievement) => {
      acc[achievement.id] = {
        earned: achievement.earned,
        earnedDate: achievement.earnedDate,
        progress: achievement.progress
      };
      return acc;
    }, {} as any);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(achievementData));
  }, [achievements]);

  const checkAchievement = useCallback((achievementId: string, progressData: any) => {
    const achievement = ENHANCED_ACHIEVEMENTS[achievementId];
    if (!achievement) return false;

    let isEarned = true;
    let progress = 0;
    let totalRequirements = achievement.requirements.length;

    for (const requirement of achievement.requirements) {
      let requirementMet = false;
      let currentValue = 0;

      switch (requirement.type) {
        case 'module_completion':
          currentValue = progressData.completedModules || 0;
          break;
        case 'lesson_count':
          currentValue = progressData.completedLessons || 0;
          break;
        case 'quiz_score':
          currentValue = progressData.averageQuizScore || 0;
          break;
        case 'streak_days':
          currentValue = progressData.currentStreak || 0;
          break;
        case 'time_spent':
          currentValue = progressData.totalStudyTime || 0;
          break;
        case 'tier_completion':
          // Check if specific tier is completed based on the achievement's tier
          const tierProgress = achievement.tier ? progressData.tierProgress?.[achievement.tier] || 0 : 0;
          currentValue = tierProgress;
          break;
        default:
          currentValue = 0;
      }

      // Check if requirement is met based on condition
      switch (requirement.condition) {
        case 'minimum':
          requirementMet = currentValue >= requirement.target;
          break;
        case 'exact':
          requirementMet = currentValue === requirement.target;
          break;
        case 'maximum':
          requirementMet = currentValue <= requirement.target;
          break;
        default:
          requirementMet = currentValue >= requirement.target;
      }

      if (requirementMet) {
        progress += 1;
      } else {
        isEarned = false;
      }
    }

    const progressPercentage = Math.round((progress / totalRequirements) * 100);

    return {
      isEarned,
      progress: progressPercentage,
      currentValues: achievement.requirements.map(req => {
        switch (req.type) {
          case 'module_completion': return progressData.completedModules || 0;
          case 'lesson_count': return progressData.completedLessons || 0;
          case 'quiz_score': return progressData.averageQuizScore || 0;
          case 'streak_days': return progressData.currentStreak || 0;
          case 'time_spent': return progressData.totalStudyTime || 0;
          case 'tier_completion': 
            const tierProgress = achievement.tier ? progressData.tierProgress?.[achievement.tier] || 0 : 0;
            return tierProgress;
          default: return 0;
        }
      })
    };
  }, []);

  const updateAchievements = useCallback((progressData: any) => {
    const currentDate = new Date().toISOString();
    let newAchievements = false;

    setAchievements(prevAchievements => {
      return prevAchievements.map(achievement => {
        if (achievement.earned) return achievement;

        const checkResult = checkAchievement(achievement.id, progressData);
        
        // Check if checkResult is valid (not false)
        if (!checkResult) {
          return achievement;
        }
        
        const updatedAchievement = {
          ...achievement,
          progress: checkResult.progress
        };

        if (checkResult.isEarned && !achievement.earned) {
          updatedAchievement.earned = true;
          updatedAchievement.earnedDate = currentDate;
          newAchievements = true;

          // Trigger notification or celebration
          if (typeof window !== 'undefined') {
            console.log(`🎉 Achievement Unlocked: ${achievement.title}!`);
            // You could dispatch a custom event here for UI notifications
            window.dispatchEvent(new CustomEvent('achievement-unlocked', {
              detail: { achievement: updatedAchievement }
            }));
          }
        }

        return updatedAchievement;
      });
    });

    return newAchievements;
  }, [checkAchievement]);

  const getAchievementProgress = useCallback((achievementId: string): AchievementProgress[string] | null => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) return null;

    const requirement = achievement.requirements[0]; // For simplicity, show first requirement
    if (!requirement) return null;

    return {
      current: achievement.progress || 0,
      target: 100,
      percentage: achievement.progress || 0
    };
  }, [achievements]);

  const getEarnedAchievements = useCallback(() => {
    return achievements.filter(achievement => achievement.earned);
  }, [achievements]);

  const getRecentAchievements = useCallback((days: number = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return achievements.filter(achievement => 
      achievement.earned && 
      achievement.earnedDate && 
      new Date(achievement.earnedDate) >= cutoffDate
    ).sort((a, b) => 
      new Date(b.earnedDate!).getTime() - new Date(a.earnedDate!).getTime()
    );
  }, [achievements]);

  const getAchievementsByCategory = useCallback((category: string) => {
    return achievements.filter(achievement => achievement.category === category);
  }, [achievements]);

  const getAchievementsByRarity = useCallback((rarity: string) => {
    return achievements.filter(achievement => achievement.rarity === rarity);
  }, [achievements]);

  const getTotalPoints = useCallback(() => {
    return achievements
      .filter(achievement => achievement.earned)
      .reduce((total, achievement) => total + achievement.points, 0);
  }, [achievements]);

  const getCompletionPercentage = useCallback(() => {
    const totalAchievements = achievements.length;
    const earnedAchievements = achievements.filter(a => a.earned).length;
    return totalAchievements > 0 ? Math.round((earnedAchievements / totalAchievements) * 100) : 0;
  }, [achievements]);

  const getNearestAchievements = useCallback(() => {
    return achievements
      .filter(achievement => !achievement.earned && (achievement.progress || 0) > 50)
      .sort((a, b) => (b.progress || 0) - (a.progress || 0))
      .slice(0, 3);
  }, [achievements]);

  const resetAchievements = useCallback(() => {
    setAchievements(Object.values(ENHANCED_ACHIEVEMENTS).map(achievement => ({
      ...achievement,
      earned: false,
      progress: 0
    })));
  }, []);

  const manuallyAwardAchievement = useCallback((achievementId: string) => {
    const currentDate = new Date().toISOString();
    
    setAchievements(prevAchievements => {
      return prevAchievements.map(achievement => {
        if (achievement.id === achievementId && !achievement.earned) {
          return {
            ...achievement,
            earned: true,
            earnedDate: currentDate,
            progress: 100
          };
        }
        return achievement;
      });
    });
  }, []);

  return {
    achievements,
    updateAchievements,
    getAchievementProgress,
    getEarnedAchievements,
    getRecentAchievements,
    getAchievementsByCategory,
    getAchievementsByRarity,
    getTotalPoints,
    getCompletionPercentage,
    getNearestAchievements,
    resetAchievements,
    manuallyAwardAchievement,
    checkAchievement
  };
};