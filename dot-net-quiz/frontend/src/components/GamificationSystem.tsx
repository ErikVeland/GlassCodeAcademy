'use client'

import React, { useState, useEffect } from 'react';
import { useProgressTracking } from '../hooks/useProgressTracking';
import { useProgressTrackingEnhanced } from '../hooks/useProgressTrackingEnhanced';

// Enhanced Achievement interface matching design documentation
interface Achievement {
  id: string;
  title: string;
  icon: string;
  description: string;
  category: 'completion' | 'streak' | 'skill' | 'velocity';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  tier?: 'foundational' | 'core' | 'specialized' | 'quality';
  badgeUrl: string;
  unlockCondition: string;
}

// Achievement definitions according to design documentation
const achievements: Record<string, Achievement> = {
  'first-lesson': { 
    id: 'first-lesson',
    title: 'First Steps', 
    icon: '👶', 
    description: 'Completed your first lesson',
    category: 'velocity',
    rarity: 'common',
    badgeUrl: '/badges/first-lesson.svg',
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
    unlockCondition: 'Complete Specialized Skills Tier'
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
    unlockCondition: 'Master both frontend and backend'
  }
};

// Tier colors matching design system
const getTierColor = (tier?: string) => {
  const colors = {
    foundational: 'from-blue-500 to-cyan-500',
    core: 'from-green-500 to-emerald-500',
    specialized: 'from-purple-500 to-violet-500',
    quality: 'from-orange-500 to-red-500'
  };
  return colors[tier as keyof typeof colors] || 'from-gray-400 to-gray-600';
};

// Rarity colors according to design documentation
const getRarityColor = (rarity: string) => {
  const colors = {
    common: 'from-gray-400 to-gray-600',
    uncommon: 'from-green-400 to-green-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-orange-500'
  };
  return colors[rarity as keyof typeof colors] || colors.common;
};

const ProgressRing: React.FC<{ percentage: number; size?: number; strokeWidth?: number }> = ({ 
  percentage, 
  size = 80, 
  strokeWidth = 6 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
          {percentage}%
        </span>
      </div>
    </div>
  );
};

const AchievementCard: React.FC<{ 
  achievement: Achievement; 
  earned: boolean; 
  earnedDate?: string;
  showUnlockCondition?: boolean; 
}> = ({ 
  achievement, 
  earned, 
  earnedDate,
  showUnlockCondition = false 
}) => {
  return (
    <div className={`relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
      earned 
        ? `bg-gradient-to-br ${achievement.tier ? getTierColor(achievement.tier) : getRarityColor(achievement.rarity)} text-white shadow-lg border-white/20` 
        : 'bg-white/10 backdrop-blur-sm border-white/20 opacity-60 hover:opacity-80'
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`text-3xl transition-all duration-300 ${
          earned ? 'grayscale-0 drop-shadow-sm' : 'grayscale opacity-50'
        }`}>
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold text-sm truncate ${
              earned ? 'text-white' : 'text-gray-200'
            }`}>
              {achievement.title}
            </h4>
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
              earned 
                ? 'bg-white/20 text-white' 
                : 'bg-gray-500/20 text-gray-300'
            }`}>
              {achievement.rarity}
            </span>
          </div>
          <p className={`text-xs mb-2 ${
            earned ? 'text-white/90' : 'text-gray-300'
          }`}>
            {achievement.description}
          </p>
          {showUnlockCondition && !earned && (
            <p className="text-xs text-yellow-300 font-medium">
              🎯 {achievement.unlockCondition}
            </p>
          )}
          {earned && earnedDate && (
            <p className="text-xs text-white/75 font-medium">
              🏆 Earned {new Date(earnedDate).toLocaleDateString()}
            </p>
          )}
          {achievement.tier && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-white/75">
                {achievement.tier.charAt(0).toUpperCase() + achievement.tier.slice(1)} Tier
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Achievement Badge */}
      {earned && (
        <div className="absolute -top-2 -right-2">
          <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
      
      {/* Rarity indicator */}
      <div className={`absolute top-2 left-2 w-2 h-2 rounded-full ${
        earned 
          ? 'bg-white shadow-sm' 
          : `bg-gradient-to-br ${getRarityColor(achievement.rarity)} opacity-60`
      }`} />
    </div>
  );
};

const StreakCounter: React.FC<{ streak: number; longestStreak: number }> = ({ streak, longestStreak }) => {
  return (
    <div className="bg-gradient-to-br from-orange-400 to-red-500 text-white p-4 rounded-xl shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="text-3xl">🔥</div>
        <div>
          <div className="text-2xl font-bold">{streak}</div>
          <div className="text-sm opacity-90">Day Streak</div>
          {longestStreak > streak && (
            <div className="text-xs opacity-75">Best: {longestStreak} days</div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatsCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: string; 
  subtitle?: string;
  gradient: string;
}> = ({ title, value, icon, subtitle, gradient }) => {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white p-4 rounded-xl shadow-lg`}>
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm opacity-90">{title}</div>
          {subtitle && (
            <div className="text-xs opacity-75">{subtitle}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export const GamificationDashboard: React.FC = () => {
  const { 
    progress, 
    streak, 
    achievements: earnedAchievements, 
    calculateOverallProgress,
    getCompletedModulesCount,
    getTotalTimeSpent,
    getAverageQuizScore
  } = useProgressTracking();
  
  // Try to use enhanced tracking if available
  const enhanced = useProgressTrackingEnhanced();
  const {
    getTierProgress,
    exportProgressData
  } = enhanced || { getTierProgress: () => 0, exportProgressData: () => {} };

  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [recentAchievement, setRecentAchievement] = useState<string | null>(null);

  const overallProgress = calculateOverallProgress();
  const completedCount = getCompletedModulesCount();
  const totalTime = getTotalTimeSpent();
  const avgScore = getAverageQuizScore();

  const earnedAchievementIds = earnedAchievements.map(a => a.id);
  const earnedCount = earnedAchievementIds.length;
  const totalAchievements = Object.keys(achievements).length;
  
  // Tier progress calculations
  const tierProgress = {
    foundational: getTierProgress('foundational'),
    core: getTierProgress('core'),
    specialized: getTierProgress('specialized'),
    quality: getTierProgress('quality')
  };

  // Achievement notification effect
  useEffect(() => {
    const latestAchievement = earnedAchievements
      .sort((a, b) => new Date(b.earnedDate).getTime() - new Date(a.earnedDate).getTime())[0];
    
    if (latestAchievement && 
        new Date(latestAchievement.earnedDate).getTime() > Date.now() - 5000) {
      setRecentAchievement(latestAchievement.id);
      setTimeout(() => setRecentAchievement(null), 5000);
    }
  }, [earnedAchievements]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };
  
  // Filter achievements
  const filteredAchievements = Object.values(achievements).filter(achievement => {
    if (!showAllAchievements && !earnedAchievementIds.includes(achievement.id)) {
      return false;
    }
    
    if (filterCategory !== 'all' && achievement.category !== filterCategory) {
      return false;
    }
    
    if (filterTier !== 'all' && achievement.tier !== filterTier) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto mb-12">
      {/* Recent Achievement Notification */}
      {recentAchievement && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-4 rounded-xl shadow-2xl border border-white/20">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="font-bold text-sm">Achievement Unlocked!</p>
                <p className="text-xs opacity-90">{achievements[recentAchievement]?.title}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Your Learning Journey
        </h2>
        <p className="text-white/80 text-lg">
          Track your progress, earn achievements, and celebrate your learning milestones
        </p>
      </div>

      {/* Main Progress Ring with Tier Breakdown */}
      <div className="flex flex-col items-center mb-8">
        <div className="mb-6">
          <ProgressRing percentage={overallProgress} size={140} strokeWidth={12} />
        </div>
        
        {/* Tier Progress Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
              {tierProgress.foundational}%
            </div>
            <p className="text-white/80 text-sm font-medium">Foundational</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
              {tierProgress.core}%
            </div>
            <p className="text-white/80 text-sm font-medium">Core</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold">
              {tierProgress.specialized}%
            </div>
            <p className="text-white/80 text-sm font-medium">Specialized</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
              {tierProgress.quality}%
            </div>
            <p className="text-white/80 text-sm font-medium">Quality</p>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Completed"
          value={completedCount}
          icon="✅"
          subtitle="modules"
          gradient="from-green-400 to-green-600"
        />
        <StatsCard
          title="Time Spent"
          value={formatTime(totalTime)}
          icon="⏱️"
          subtitle="learning"
          gradient="from-blue-400 to-blue-600"
        />
        <StatsCard
          title="Avg Score"
          value={avgScore > 0 ? `${avgScore}%` : '-'}
          icon="🎯"
          subtitle="quiz average"
          gradient="from-purple-400 to-purple-600"
        />
        <StreakCounter streak={streak.currentStreak} longestStreak={streak.longestStreak} />
      </div>

      {/* Achievements Section */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Achievements
            </h3>
            <p className="text-white/80">
              {earnedCount} of {totalAchievements} unlocked • 
              <span className="text-yellow-300 font-medium ml-1">
                {Math.round((earnedCount / totalAchievements) * 100)}% Complete
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportProgressData && exportProgressData()}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              📥 Export
            </button>
            <button
              onClick={() => setShowAllAchievements(!showAllAchievements)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              {showAllAchievements ? 'Show Earned Only' : 'Show All'}
            </button>
          </div>
        </div>
        
        {/* Achievement Filters */}
        {showAllAchievements && (
          <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-2">
              <label className="text-white/80 text-sm font-medium">Category:</label>
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-1 text-sm"
              >
                <option value="all">All</option>
                <option value="completion">Completion</option>
                <option value="streak">Streak</option>
                <option value="skill">Skill</option>
                <option value="velocity">Velocity</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-white/80 text-sm font-medium">Tier:</label>
              <select 
                value={filterTier} 
                onChange={(e) => setFilterTier(e.target.value)}
                className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-1 text-sm"
              >
                <option value="all">All</option>
                <option value="foundational">Foundational</option>
                <option value="core">Core</option>
                <option value="specialized">Specialized</option>
                <option value="quality">Quality</option>
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map(achievement => {
              const earned = earnedAchievementIds.includes(achievement.id);
              const earnedData = earnedAchievements.find(a => a.id === achievement.id);
              
              return (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  earned={earned}
                  earnedDate={earnedData?.earnedDate}
                  showUnlockCondition={!earned}
                />
              );
            })}
        </div>

        {!showAllAchievements && earnedCount === 0 && (
          <div className="text-center py-12">
            <div className="text-8xl mb-6">🏆</div>
            <h4 className="text-xl font-bold text-white mb-4">
              Ready to Start Your Journey?
            </h4>
            <p className="text-white/80 mb-6 max-w-md mx-auto">
              Complete your first lesson to unlock achievements and start building your learning streak!
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowAllAchievements(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                🔎 View All Achievements
              </button>
            </div>
          </div>
        )}
        
        {showAllAchievements && filteredAchievements.length === 0 && (
          <div className="text-center py-8">
            <p className="text-white/60">No achievements match your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export { GamificationDashboard as GamificationSystem };
export default GamificationDashboard;