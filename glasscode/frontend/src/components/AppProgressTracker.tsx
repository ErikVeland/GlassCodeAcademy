'use client';

import React, { useState } from 'react';
import { 
  APP_PHASES, 
  calculatePhaseProgress, 
  calculateGoalProgress,
  getProductionReadiness,
  getNextMilestone,
  getProgressIncrease,
  isRecentlyUpdated,
  getRecentProgressIncreases,
  type Phase,
  type Goal 
} from '@/lib/appProgressConfig';

interface ProgressChipProps {
  goal: Goal;
  isExpanded: boolean;
  onClick: () => void;
}

const ProgressChip: React.FC<ProgressChipProps> = ({ goal, isExpanded, onClick }) => {
  const progress = Math.max(goal.currentProgress, calculateGoalProgress(goal));
  const progressIncrease = getProgressIncrease(goal);
  const recentlyUpdated = isRecentlyUpdated(goal);
  
  // Calculate gradient colors based on progress
  const getGradientColor = (percentage: number) => {
    if (percentage < 30) return 'from-red-500 to-red-400';
    if (percentage < 60) return 'from-orange-500 to-yellow-400';
    if (percentage < 80) return 'from-yellow-400 to-green-400';
    return 'from-green-500 to-green-400';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'infrastructure': return '🏗️';
      case 'content': return '📚';
      case 'features': return '✨';
      case 'quality': return '🔧';
      case 'deployment': return '🚀';
      default: return '📋';
    }
  };

  return (
    <div className="relative group cursor-pointer transition-transform md:hover:scale-[1.01] lg:hover:scale-102 active:scale-98 transform-gpu will-change-transform">
      <div 
        className="relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-4 min-h-[120px]"
        onClick={onClick}
      >
        {/* Background gradient fill from bottom */}
        <div 
          className={`absolute inset-0 bg-gradient-to-t ${getGradientColor(progress)} opacity-20 transition-all duration-500`}
          style={{ 
            clipPath: `polygon(0 ${100 - progress}%, 100% ${100 - progress}%, 100% 100%, 0 100%)` 
          }}
        />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getCategoryIcon(goal.category)}</span>
              {/* Importance indicators */}
              <div className="flex items-center gap-1">
                {goal.importance >= 9 ? (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-400/30">
                    <span className="text-red-400 text-xs">🔥</span>
                    <span className="text-red-400 text-xs font-medium">Critical</span>
                  </div>
                ) : goal.importance >= 7 ? (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-400/30">
                    <span className="text-yellow-400 text-xs">⭐</span>
                    <span className="text-yellow-400 text-xs font-medium">High</span>
                  </div>
                ) : goal.importance >= 5 ? (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30">
                    <span className="text-blue-400 text-xs">📋</span>
                    <span className="text-blue-400 text-xs font-medium">Medium</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-500/20 border border-gray-400/30">
                    <span className="text-gray-400 text-xs">📝</span>
                    <span className="text-gray-400 text-xs font-medium">Low</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {recentlyUpdated && progressIncrease > 0 && (
                <div className="bg-green-500/20 border border-green-400/30 rounded-full px-2 py-1 text-xs font-medium text-green-300 animate-pulse">
                  +{progressIncrease}%↗
                </div>
              )}
              {progress === 100 && (
                <div className="text-green-400 text-xl">✓</div>
              )}
            </div>
          </div>
          
          <h4 className="text-white font-medium text-sm mb-1 line-clamp-2">
            {goal.title}
          </h4>
          
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-xs">
              {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} milestones
            </span>
            <span className="text-white font-bold text-sm">
              {progress}%
            </span>
          </div>
        </div>
      </div>
      
      {/* Expanded details - using conditional rendering instead of dynamic display */}
      {isExpanded && (
        <div className="mt-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 transition-all duration-300">
          <p className="text-white/80 text-xs mb-3">{goal.description}</p>
          <div className="space-y-2">
            {goal.milestones.map((milestone) => (
              <div key={`${goal.id}-${milestone.id}`} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                  milestone.completed 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-white/30'
                }`}>
                  {milestone.completed && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </div>
                <span className={`text-xs ${
                  milestone.completed ? 'text-white' : 'text-white/60'
                }`}>
                  {milestone.title}
                </span>
                {milestone.completed && milestone.completedDate && (
                  <span className="text-xs text-green-400 ml-auto">
                    {new Date(milestone.completedDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface PhaseProgressBarProps {
  phase: Phase;
  isActive: boolean;
  onClick: () => void;
}

const PhaseProgressBar: React.FC<PhaseProgressBarProps> = ({ phase, isActive, onClick }) => {
  const progress = calculatePhaseProgress(phase.id);
  
  return (
    <div className="cursor-pointer transition-transform hover:scale-101" onClick={onClick}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{phase.icon}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-white font-semibold text-sm">{phase.title}</h3>
            <span className="text-white/80 text-sm font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ 
                backgroundColor: phase.color,
                width: `${progress}%`
              }}
            />
          </div>
        </div>
      </div>
      
      {isActive && (
        <div className="ml-11 mb-4 transition-all duration-300">
          <p className="text-white/70 text-xs mb-3">{phase.description}</p>
          <div className="text-xs text-white/60">
            <div className="flex gap-4">
              <span>Goals: {phase.goals.length}</span>
              <span>Status: {phase.status.replace('-', ' ')}</span>
              {phase.targetDate && (
                <span>Target: {new Date(phase.targetDate).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AppProgressTracker: React.FC = () => {
  const [activePhase, setActivePhase] = useState<string | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  
  const productionReadiness = getProductionReadiness();
  const nextMilestone = getNextMilestone();
  const recentIncreases = getRecentProgressIncreases();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          App Development Progress
        </h2>
        <p className="text-white/70 text-sm">
          Tracking our journey to production-ready GlassCode Academy
        </p>
      </div>

      {/* Recent Progress Increases */}
      {recentIncreases.length > 0 && (
        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-sm border border-green-400/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-400 text-lg">📈</span>
            <h3 className="text-white font-semibold">Recent Progress Updates</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentIncreases.map((goal) => (
              <div key={goal.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm font-medium">{goal.title}</span>
                  <div className="bg-green-500/20 border border-green-400/30 rounded-full px-2 py-1 text-xs font-medium text-green-300">
                    +{goal.progressIncrease}%↗
                  </div>
                </div>
                <div className="text-white/60 text-xs">
                  {goal.currentProgress - goal.progressIncrease}% → {goal.currentProgress}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Progress */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-white mb-1">
            {productionReadiness}%
          </div>
          <div className="text-white/70 text-sm">Production Ready</div>
        </div>
        
        <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 rounded-full transition-all duration-2000 ease-out"
            style={{ width: `${productionReadiness}%` }}
          />
        </div>
        
        {nextMilestone && (
          <div className="text-center">
            <div className="text-white/60 text-xs mb-1">Next Milestone:</div>
            <div className="text-white text-sm font-medium">
              {nextMilestone.milestone}
            </div>
            <div className="text-white/50 text-xs">
              {nextMilestone.phase} → {nextMilestone.goal}
            </div>
          </div>
        )}
      </div>

      {/* Phase Progress */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Development Phases</h3>
        <div className="space-y-4">
          {APP_PHASES.map((phase) => (
            <PhaseProgressBar
              key={phase.id}
              phase={phase}
              isActive={activePhase === phase.id}
              onClick={() => setActivePhase(activePhase === phase.id ? null : phase.id)}
            />
          ))}
        </div>
      </div>

      {/* Goals Grid */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Development Goals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {APP_PHASES.flatMap(phase => phase.goals).map((goal) => (
            <ProgressChip
              key={`goal-${goal.id}`} // Using a more unique key
              goal={goal}
              isExpanded={expandedGoal === goal.id}
              onClick={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
            />
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">
            {APP_PHASES.length}
          </div>
          <div className="text-white/70 text-sm">Phases</div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">
            {APP_PHASES.flatMap(p => p.goals).length}
          </div>
          <div className="text-white/70 text-sm">Goals</div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">
            {APP_PHASES.flatMap(p => p.goals).flatMap(g => g.milestones).filter(m => m.completed).length}
          </div>
          <div className="text-white/70 text-sm">Completed</div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">
            {APP_PHASES.flatMap(p => p.goals).flatMap(g => g.milestones).length}
          </div>
          <div className="text-white/70 text-sm">Total Milestones</div>
        </div>
      </div>
    </div>
  );
};

export default AppProgressTracker;