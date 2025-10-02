'use client'

import React, { useState, useEffect } from 'react';
import { useProgressTracking, AchievementData } from '../hooks/useProgressTracking';

interface StreakData {
  current: number;
  longest: number;
  lastActivity: Date | null;
}

const GamificationDashboard: React.FC = () => {
  const { progress, achievements, getCompletedModulesCount, calculateOverallProgress } = useProgressTracking();
  const [streakData, setStreakData] = useState<StreakData>({ current: 0, longest: 0, lastActivity: null });
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Initialize gamification data
  useEffect(() => {
    const initializeGamification = () => {
      // Load streak data from localStorage
      const savedStreak = localStorage.getItem('learning_streak');
      if (savedStreak) {
        const parsed = JSON.parse(savedStreak);
        setStreakData({
          ...parsed,
          lastActivity: parsed.lastActivity ? new Date(parsed.lastActivity) : null
        });
      }
    };

    initializeGamification();
  }, [progress]);

  const updateStreak = () => {
    const today = new Date();
    const lastActivity = streakData.lastActivity;
    
    if (!lastActivity) {
      // First activity
      const newStreak = { current: 1, longest: 1, lastActivity: today };
      setStreakData(newStreak);
      localStorage.setItem('learning_streak', JSON.stringify(newStreak));
    } else {
      const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day
        const current = streakData.current + 1;
        const newStreak = {
          current,
          longest: Math.max(current, streakData.longest),
          lastActivity: today
        };
        setStreakData(newStreak);
        localStorage.setItem('learning_streak', JSON.stringify(newStreak));
      } else if (daysDiff > 1) {
        // Streak broken
        const newStreak = { current: 1, longest: streakData.longest, lastActivity: today };
        setStreakData(newStreak);
        localStorage.setItem('learning_streak', JSON.stringify(newStreak));
      }
    }
  };

  const filteredAchievements = achievements.filter(achievement => 
    selectedRarity === 'all' || achievement.type === selectedRarity
  );

  const getRarityColor = (type: string) => {
    const colors = {
      completion: 'text-blue-600 bg-blue-100',
      streak: 'text-green-600 bg-green-100',
      skill: 'text-purple-600 bg-purple-100',
      velocity: 'text-yellow-600 bg-yellow-100'
    };
    return colors[type as keyof typeof colors] || colors.completion;
  };

  const getStreakIcon = () => {
    if (streakData.current >= 30) return '🔥🔥🔥';
    if (streakData.current >= 14) return '🔥🔥';
    if (streakData.current >= 7) return '🔥';
    return '📅';
  };

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            🎮 Progress Dashboard
          </h2>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label={isCollapsed ? 'Expand dashboard' : 'Collapse dashboard'}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>

        {!isCollapsed && (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-90">Modules Completed</div>
                    <div className="text-2xl font-bold">{getCompletedModulesCount()}</div>
                  </div>
                  <div className="text-3xl">📚</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-90">Overall Progress</div>
                    <div className="text-2xl font-bold">{calculateOverallProgress()}%</div>
                  </div>
                  <div className="text-3xl">📊</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-90">Current Streak</div>
                    <div className="text-2xl font-bold">{streakData.current} days</div>
                  </div>
                  <div className="text-3xl">{getStreakIcon()}</div>
                </div>
              </div>
            </div>

            {/* Achievements Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  🏆 Achievements ({achievements.length})
                </h3>
                <select
                  value={selectedRarity}
                  onChange={(e) => setSelectedRarity(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="completion">Completion</option>
                  <option value="streak">Streak</option>
                  <option value="skill">Skill</option>
                  <option value="velocity">Velocity</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredAchievements.map(achievement => (
                  <div 
                    key={achievement.id} 
                    className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">🏆</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {achievement.type.charAt(0).toUpperCase() + achievement.type.slice(1)} Achievement
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${getRarityColor(achievement.type)}`}>
                            {achievement.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {achievement.description}
                        </p>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          Unlocked {new Date(achievement.earnedDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredAchievements.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-2">🎯</div>
                  <p>No achievements yet. Keep learning to unlock rewards!</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GamificationDashboard;