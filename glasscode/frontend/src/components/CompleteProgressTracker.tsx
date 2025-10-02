'use client'

import React, { useState, useEffect } from 'react';
import { useProgressTrackingComplete } from '../hooks/useProgressTrackingComplete';

// Tier colors matching design system
const getTierColor = (tier?: string) => {
  const colors: Record<string, string> = {
    foundational: 'from-blue-500 to-cyan-500',
    core: 'from-green-500 to-emerald-500',
    specialized: 'from-purple-500 to-violet-500',
    quality: 'from-orange-500 to-red-500'
  };
  return colors[tier || 'foundational'] || 'from-gray-400 to-gray-600';
};

// Rarity colors according to design documentation
const getRarityColor = (rarity: string) => {
  const colors: Record<string, string> = {
    common: 'from-gray-400 to-gray-600',
    uncommon: 'from-green-400 to-green-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-orange-500'
  };
  return colors[rarity] || colors.common;
};

const ProgressRing: React.FC<{ 
  percentage: number; 
  size?: number; 
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  gradient?: string;
}> = ({ 
  percentage, 
  size = 80, 
  strokeWidth = 6,
  showLabel = true,
  label,
  gradient = 'from-blue-500 to-cyan-500'
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
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#progressGradient-${gradient.replace(/\s+/g, '-')})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
        <defs>
          <linearGradient id={`progressGradient-${gradient.replace(/\s+/g, '-')}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradient.split(' ')[0].replace('from-', '')} />
            <stop offset="100%" stopColor={gradient.split(' ')[2].replace('to-', '')} />
          </linearGradient>
        </defs>
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-white">
            {percentage}%
          </span>
          {label && (
            <span className="text-xs text-white/70 mt-1">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const AchievementCard: React.FC<{ 
  achievement: any; 
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

const TierProgressCard: React.FC<{ 
  tierName: string; 
  tierKey: string;
  progress: number;
  modules: number;
  completed: number;
}> = ({ tierName, tierKey, progress, modules, completed }) => {
  const tierColor = getTierColor(tierKey);
  
  return (
    <div className={`bg-gradient-to-br ${tierColor} p-4 rounded-xl text-white shadow-lg`}>
      <h3 className="font-bold text-lg mb-2">{tierName}</h3>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm">{completed}/{modules}</span>
        <span className="text-sm font-bold">{progress}%</span>
      </div>
      <div className="w-full bg-white/20 rounded-full h-2">
        <div 
          className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export const CompleteProgressTracker: React.FC = () => {
  const {
    progress,
    streak,
    achievements,
    userStats,
    calculateOverallProgress,
    getTierProgress,
    getCompletedModulesCount,
    getTotalTimeSpent,
    getAverageQuizScore,
    getRecentAchievements,
    getStreakStatus,
    getStreakMotivation,
    exportProgressData,
    importProgressData
  } = useProgressTrackingComplete();

  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [recentAchievement, setRecentAchievement] = useState<string | null>(null);
  const [importData, setImportData] = useState<string>('');
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  const overallProgress = calculateOverallProgress();
  const completedCount = getCompletedModulesCount();
  const totalTime = getTotalTimeSpent();
  const avgScore = getAverageQuizScore();
  const recentAchievements = getRecentAchievements();

  const earnedAchievementIds = achievements.map(a => a.id);
  const earnedCount = earnedAchievementIds.length;
  const totalAchievements = Object.keys({
    'first-lesson': {},
    'foundation-master': {},
    'core-developer': {},
    'specialist': {},
    'quality-guardian': {},
    'speed-learner': {},
    'perfectionist': {},
    'streak-warrior': {},
    'streak-legend': {},
    'full-stack': {},
    'quiz-master': {},
    'consistent-learner': {}
  }).length;

  // Tier progress calculations
  const tierProgress = {
    foundational: getTierProgress('foundational'),
    core: getTierProgress('core'),
    specialized: getTierProgress('specialized'),
    quality: getTierProgress('quality')
  };

  // Tier module counts
  const tierModuleCounts = {
    foundational: { total: 3, completed: 0 },
    core: { total: 6, completed: 0 },
    specialized: { total: 5, completed: 0 },
    quality: { total: 4, completed: 0 }
  };

  // Update tier module counts based on actual progress
  Object.entries(tierModuleCounts).forEach(([tier, counts]) => {
    const tierModules = (Object as any).values(progress).filter((p: any) => p.tier === tier);
    counts.completed = tierModules.filter((p: any) => p.completionStatus === 'completed').length;
  });

  // Format time for display
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Filter achievements
  const filteredAchievements = Object.values({
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
  }).filter((achievement: any) => {
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

  const handleImport = () => {
    if (importData.trim()) {
      const result = importProgressData(importData);
      setImportResult(result);
      if (result.success) {
        setImportData('');
      }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto mb-12 p-4">
      {/* Recent Achievement Notification */}
      {recentAchievement && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-4 rounded-xl shadow-2xl border border-white/20">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="font-bold text-sm">Achievement Unlocked!</p>
                <p className="text-xs opacity-90">First Steps</p>
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
          <ProgressRing 
            percentage={overallProgress} 
            size={140} 
            strokeWidth={12} 
            label="Overall Progress"
            gradient="from-blue-500 to-purple-600"
          />
        </div>
        
        {/* Tier Progress Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
          <TierProgressCard 
            tierName="Foundational" 
            tierKey="foundational"
            progress={tierProgress.foundational}
            modules={tierModuleCounts.foundational.total}
            completed={tierModuleCounts.foundational.completed}
          />
          <TierProgressCard 
            tierName="Core" 
            tierKey="core"
            progress={tierProgress.core}
            modules={tierModuleCounts.core.total}
            completed={tierModuleCounts.core.completed}
          />
          <TierProgressCard 
            tierName="Specialized" 
            tierKey="specialized"
            progress={tierProgress.specialized}
            modules={tierModuleCounts.specialized.total}
            completed={tierModuleCounts.specialized.completed}
          />
          <TierProgressCard 
            tierName="Quality" 
            tierKey="quality"
            progress={tierProgress.quality}
            modules={tierModuleCounts.quality.total}
            completed={tierModuleCounts.quality.completed}
          />
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

      {/* Streak and Motivation */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">Learning Streak</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">🔥</div>
              <div>
                <div className="text-3xl font-bold text-white">{streak.currentStreak}</div>
                <div className="text-white/80">Current Streak</div>
              </div>
              <div className="h-12 w-px bg-white/20"></div>
              <div>
                <div className="text-xl font-bold text-white">{streak.longestStreak}</div>
                <div className="text-white/80">Longest Streak</div>
              </div>
            </div>
            <p className="text-white/80 italic">
              "{getStreakMotivation()}"
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={exportProgressData}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              📥 Export Progress
            </button>
            <button
              onClick={() => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.json';
                fileInput.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        setImportData(event.target.result as string);
                        handleImport();
                      }
                    };
                    reader.readAsText(file);
                  }
                };
                fileInput.click();
              }}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              📤 Import Progress
            </button>
          </div>
        </div>
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
          {filteredAchievements.map((achievement: any) => {
              const earned = earnedAchievementIds.includes(achievement.id);
              const earnedData = achievements.find(a => a.id === achievement.id);
              
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

export default CompleteProgressTracker;