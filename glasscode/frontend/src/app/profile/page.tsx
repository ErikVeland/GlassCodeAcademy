'use client';

import React from 'react';
import Link from 'next/link';
import { useProfile } from '../../components/ProfileProvider';
import { useProgressTracking } from '../../hooks/useProgressTracking';

export default function ProfileOverviewPage() {
  const { profile } = useProfile();
  const {
    streak,
    achievements,
    getCompletedModulesCount,
    getTotalTimeSpent,
    getAverageQuizScore,
    calculateOverallProgress,
    exportProgressData
  } = useProgressTracking();
  const sizePx = 96;
  const completedModules = getCompletedModulesCount();
  const totalStudyTimeMin = Math.round(getTotalTimeSpent());
  const avgQuizScore = getAverageQuizScore();
  const overallProgress = Math.round(calculateOverallProgress());
  const recentAchievements = [...achievements]
    .sort((a, b) => new Date(b.earnedDate).getTime() - new Date(a.earnedDate).getTime())
    .slice(0, 5);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
        <div className="flex items-center space-x-4 mb-6">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Profile" className="rounded-full object-cover" style={{ width: sizePx, height: sizePx }} />
          ) : (
            <div className="rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-4xl" style={{ width: sizePx, height: sizePx }}>
              <span>👤</span>
            </div>
          )}
          <div>
            <div className="text-lg font-semibold">{profile.displayName || 'Anonymous Learner'}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Keep learning and earning achievements!</div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Link href="/profile/edit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Edit Profile</Link>
          <Link href="/login" className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600">Login / Register</Link>
          <button onClick={exportProgressData} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Export Progress</button>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Learning Progress</h2>
          <span className="text-sm text-gray-600 dark:text-gray-400">Overall {overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded">
          <div className="bg-blue-600 h-2 rounded" style={{ width: `${overallProgress}%` }} />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Modules Completed</div>
            <div className="text-2xl font-bold">{completedModules}</div>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Study Time</div>
            <div className="text-2xl font-bold">{totalStudyTimeMin} min</div>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Average Quiz Score</div>
            <div className="text-2xl font-bold">{avgQuizScore}%</div>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Current Tier</div>
            <div className="text-2xl font-bold">{/* Placeholder until tier calculation hooked */}—</div>
          </div>
        </div>
      </div>

      {/* Streaks */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-2">Streaks</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Current Streak</div>
            <div className="text-2xl font-bold">{streak.currentStreak} days</div>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Longest Streak</div>
            <div className="text-2xl font-bold">{streak.longestStreak} days</div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Recent Achievements</h2>
        {recentAchievements.length === 0 ? (
          <div className="text-sm text-gray-600 dark:text-gray-400">No achievements yet — start a module to earn some!</div>
        ) : (
          <ul className="space-y-3">
            {recentAchievements.map((ach) => (
              <li key={ach.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  {ach.badgeUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ach.badgeUrl} alt={ach.description} className="w-8 h-8" />
                  ) : (
                    <span className="text-xl">🏆</span>
                  )}
                  <div>
                    <div className="font-medium">{ach.description}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{new Date(ach.earnedDate).toLocaleDateString()} • {ach.type}</div>
                  </div>
                </div>
                {ach.moduleId && (
                  <Link href={`/modules/${ach.moduleId}`} className="text-sm text-blue-600 hover:underline">View module</Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}