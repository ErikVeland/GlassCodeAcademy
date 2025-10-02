'use client'

import React from 'react';

interface TechnologyUtilizationBoxProps {
  technology: string;
  explanation: string;
}

const TechnologyUtilizationBox = ({ technology, explanation }: TechnologyUtilizationBoxProps) => {
  // Define color schemes for each technology
  const getColorScheme = () => {
    switch (technology.toLowerCase()) {
      case 'react':
        return 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200';
      case 'tailwind':
        return 'bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700 text-teal-800 dark:text-teal-200';
      case 'node.js':
        return 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200';
      case 'sass':
        return 'bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-700 text-pink-800 dark:text-pink-200';
      case 'laravel':
        return 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200';
      case '.net':
        return 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-200';
      default:
        return 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200';
    }
  };

  return (
    <div className={`mt-6 p-4 ${getColorScheme()} rounded-lg backdrop-blur-sm border`}>
      <h3 className="text-lg font-bold mb-2">Technology Utilization</h3>
      <p>{explanation}</p>
    </div>
  );
};

export default TechnologyUtilizationBox;