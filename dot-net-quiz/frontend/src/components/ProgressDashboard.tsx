import React, { useState, useEffect } from 'react';
import { useProgressTracking } from '../hooks/useProgressTracking';
import { useStreakTracking } from '../hooks/useStreakTracking';
import { useAchievements } from '../hooks/useAchievements';
import './ProgressDashboard.scss';

interface DashboardStats {
  totalModules: number;
  completedModules: number;
  completionPercentage: number;
  totalLessons: number;
  completedLessons: number;
  totalQuizzes: number;
  passedQuizzes: number;
  averageQuizScore: number;
  studyTime: number; // in minutes
  currentTier: string;
  nextTier?: string;
}

interface VisualProgressProps {
  percentage: number;
  size?: 'small' | 'medium' | 'large';
  variant?: 'circular' | 'linear' | 'radial';
  showLabel?: boolean;
  animated?: boolean;
}

const VisualProgress: React.FC<VisualProgressProps> = ({
  percentage,
  size = 'medium',
  variant = 'circular',
  showLabel = true,
  animated = true
}) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedPercentage(percentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedPercentage(percentage);
    }
  }, [percentage, animated]);

  const getSize = () => {
    switch (size) {
      case 'small': return 60;
      case 'large': return 120;
      default: return 80;
    }
  };

  const radius = getSize() / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

  if (variant === 'linear') {
    return (
      <div className={`progress-linear progress-${size}`}>
        <div className="progress-track">
          <div 
            className="progress-fill"
            style={{ 
              width: `${animatedPercentage}%`,
              transition: animated ? 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
            }}
          />
        </div>
        {showLabel && <span className="progress-label">{Math.round(percentage)}%</span>}
      </div>
    );
  }

  if (variant === 'radial') {
    return (
      <div className={`progress-radial progress-${size}`}>
        <svg width={getSize()} height={getSize()}>
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <circle
            cx={getSize() / 2}
            cy={getSize() / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx={getSize() / 2}
            cy={getSize() / 2}
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: animated ? 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%'
            }}
          />
        </svg>
        {showLabel && (
          <div className="progress-center-label">
            <span className="percentage">{Math.round(percentage)}%</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`progress-circular progress-${size}`}>
      <svg width={getSize()} height={getSize()}>
        <circle
          cx={getSize() / 2}
          cy={getSize() / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="6"
        />
        <circle
          cx={getSize() / 2}
          cy={getSize() / 2}
          r={radius}
          fill="none"
          stroke="#4f46e5"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: animated ? 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%'
          }}
        />
      </svg>
      {showLabel && (
        <div className="progress-center-label">
          <span className="percentage">{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
};

const TierProgressCard: React.FC<{ tierName: string; modules: any[]; }> = ({ tierName, modules }) => {
  const completedModules = modules.filter(m => m.completionStatus === 'completed').length;
  const percentage = modules.length > 0 ? (completedModules / modules.length) * 100 : 0;

  return (
    <div className="tier-progress-card">
      <div className="tier-header">
        <h3 className="tier-title">{tierName}</h3>
        <span className="tier-count">{completedModules}/{modules.length}</span>
      </div>
      <VisualProgress 
        percentage={percentage} 
        variant="linear" 
        size="small" 
        showLabel={false}
      />
      <div className="tier-modules">
        {modules.map((module, index) => (
          <div 
            key={index}
            className={`module-indicator ${module.completionStatus === 'completed' ? 'completed' : 
              module.completionStatus === 'in_progress' ? 'in-progress' : 'pending'}`}
            title={module.title}
          />
        ))}
      </div>
    </div>
  );
};

const AchievementBadge: React.FC<{ achievement: any; size?: 'small' | 'medium' | 'large' }> = ({ 
  achievement, 
  size = 'medium' 
}) => {
  return (
    <div className={`achievement-badge achievement-${size} ${achievement.earned ? 'earned' : 'locked'}`}>
      <div className="badge-icon">
        {achievement.earned ? '🏆' : '🔒'}
      </div>
      <div className="badge-info">
        <h4 className="badge-title">{achievement.title}</h4>
        <p className="badge-description">{achievement.description}</p>
        {achievement.earned && achievement.earnedDate && (
          <span className="badge-date">Earned: {new Date(achievement.earnedDate).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
};

export const ProgressDashboard: React.FC = () => {
  const { progress, calculateOverallProgress, getTierProgress, getCompletedModulesCount, getTotalTimeSpent, getAverageQuizScore } = useProgressTracking();
  const { streakData, getStreakStatus, getStreakMotivation } = useStreakTracking();
  const { achievements, getRecentAchievements } = useAchievements();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'achievements' | 'streaks'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    // Calculate dashboard statistics
    const allProgress = progress;
    
    const totalModules = Object.keys(allProgress).length;
    const completedModules = Object.values(allProgress).filter(p => p.completionStatus === 'completed').length;
    const totalLessons = Object.values(allProgress).reduce((sum, p) => sum + p.totalLessons, 0);
    const completedLessons = Object.values(allProgress).reduce((sum, p) => sum + p.lessonsCompleted, 0);
    const totalQuizzes = Object.values(allProgress).filter(p => p.quizScore !== null).length;
    const passedQuizzes = Object.values(allProgress).filter(p => p.quizScore && p.quizScore >= 70).length;
    const averageQuizScore = totalQuizzes > 0 ? 
      Object.values(allProgress).reduce((sum, p) => sum + (p.quizScore || 0), 0) / totalQuizzes : 0;
    const studyTime = getTotalTimeSpent();

    // Simplified tier calculation
    const currentTier = 'foundational'; // This would be calculated based on progress
    const nextTier = 'core'; // This would be calculated based on progress

    setStats({
      totalModules,
      completedModules,
      completionPercentage: totalModules > 0 ? (completedModules / totalModules) * 100 : 0,
      totalLessons,
      completedLessons,
      totalQuizzes,
      passedQuizzes,
      averageQuizScore,
      studyTime,
      currentTier,
      nextTier
    });
  }, [progress, getTotalTimeSpent]);

  const streakStatus = getStreakStatus();
  const recentAchievements = getRecentAchievements();

  if (!stats) {
    return <div className="progress-dashboard loading">Loading dashboard...</div>;
  }

  return (
    <div className="progress-dashboard">
      <div className="dashboard-header">
        <h1>Learning Progress Dashboard</h1>
        <div className="dashboard-summary">
          <div className="summary-card">
            <VisualProgress percentage={stats.completionPercentage} size="large" variant="radial" />
            <div className="summary-info">
              <h2>Overall Progress</h2>
              <p>{stats.completedModules} of {stats.totalModules} modules completed</p>
            </div>
          </div>
          
          <div className="quick-stats">
            <div className="stat-item">
              <span className="stat-value">{streakData.currentStreak}</span>
              <span className="stat-label">Day Streak</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.completedLessons}</span>
              <span className="stat-label">Lessons</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{Math.round(stats.averageQuizScore)}%</span>
              <span className="stat-label">Avg Score</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{Math.round(stats.studyTime / 60)}h</span>
              <span className="stat-label">Study Time</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          Module Progress
        </button>
        <button 
          className={`tab-button ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          Achievements
        </button>
        <button 
          className={`tab-button ${activeTab === 'streaks' ? 'active' : ''}`}
          onClick={() => setActiveTab('streaks')}
        >
          Streaks
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="progress-grid">
              <div className="grid-item">
                <h3>Learning Streak</h3>
                <div className="streak-info">
                  <div className="streak-current">
                    <span className="streak-number">{streakData.currentStreak}</span>
                    <span className="streak-label">days</span>
                  </div>
                  <div className="streak-status">
                    <span className={`status-indicator ${streakStatus.status}`} />
                    <span className="status-message">{streakStatus.message}</span>
                  </div>
                  <p className="streak-motivation">{getStreakMotivation()}</p>
                </div>
              </div>

              <div className="grid-item">
                <h3>Recent Achievements</h3>
                <div className="recent-achievements">
                  {recentAchievements.length > 0 ? (
                    recentAchievements.slice(0, 3).map((achievement, index) => (
                      <AchievementBadge key={index} achievement={achievement} size="small" />
                    ))
                  ) : (
                    <p>Complete lessons and quizzes to earn achievements!</p>
                  )}
                </div>
              </div>

              <div className="grid-item">
                <h3>Performance Metrics</h3>
                <div className="metrics-list">
                  <div className="metric">
                    <span className="metric-label">Lesson Completion Rate</span>
                    <VisualProgress 
                      percentage={stats.totalLessons > 0 ? (stats.completedLessons / stats.totalLessons) * 100 : 0}
                      variant="linear"
                      size="small"
                    />
                  </div>
                  <div className="metric">
                    <span className="metric-label">Quiz Pass Rate</span>
                    <VisualProgress 
                      percentage={stats.totalQuizzes > 0 ? (stats.passedQuizzes / stats.totalQuizzes) * 100 : 0}
                      variant="linear"
                      size="small"
                    />
                  </div>
                  <div className="metric">
                    <span className="metric-label">Average Quiz Score</span>
                    <VisualProgress 
                      percentage={stats.averageQuizScore}
                      variant="linear"
                      size="small"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="progress-tab">
            <div className="tier-progress-grid">
              {/* This would be populated with actual tier data from the registry */}
              <TierProgressCard tierName="Foundational" modules={[]} />
              <TierProgressCard tierName="Core Technologies" modules={[]} />
              <TierProgressCard tierName="Advanced Applications" modules={[]} />
              <TierProgressCard tierName="Professional Practices" modules={[]} />
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="achievements-tab">
            <div className="achievements-grid">
              {achievements.map((achievement, index) => (
                <AchievementBadge key={index} achievement={achievement} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'streaks' && (
          <div className="streaks-tab">
            <div className="streak-details">
              <div className="streak-overview">
                <h3>Streak Overview</h3>
                <div className="streak-stats">
                  <div className="streak-stat">
                    <span className="stat-value">{streakData.currentStreak}</span>
                    <span className="stat-label">Current Streak</span>
                  </div>
                  <div className="streak-stat">
                    <span className="stat-value">{streakData.longestStreak}</span>
                    <span className="stat-label">Longest Streak</span>
                  </div>
                  <div className="streak-stat">
                    <span className="stat-value">{streakData.streakHistory.length}</span>
                    <span className="stat-label">Total Activities</span>
                  </div>
                </div>
              </div>

              <div className="streak-milestones">
                <h3>Milestone Progress</h3>
                <div className="milestones-list">
                  {streakData.milestones.map((milestone, index) => (
                    <div key={index} className={`milestone ${milestone.achieved ? 'achieved' : 'pending'}`}>
                      <div className="milestone-icon">
                        {milestone.achieved ? '✅' : '⏳'}
                      </div>
                      <div className="milestone-info">
                        <h4>{milestone.title}</h4>
                        <p>{milestone.description}</p>
                        <span className="milestone-threshold">{milestone.threshold} days</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="streak-history">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  {streakData.streakHistory.slice(-10).reverse().map((activity, index) => (
                    <div key={index} className="activity-item">
                      <span className="activity-date">{activity.date}</span>
                      <span className="activity-description">{activity.activity}</span>
                      <span className="activity-points">+{activity.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};