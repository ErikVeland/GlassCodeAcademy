"use client";

import React from "react";

interface SkeletonLoaderProps {
  type?: "lesson" | "quiz" | "module" | "text" | "card";
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = "text",
  count = 1,
}) => {
  // Generate shimmer effect with CSS
  const shimmerClasses =
    "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_400%] dark:from-gray-700 dark:via-gray-600 dark:to-gray-700";

  // Render different skeleton types
  const renderSkeleton = () => {
    switch (type) {
      case "lesson":
        return (
          <div className="space-y-4">
            {/* Lesson title */}
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>

            {/* Lesson intro */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/6"></div>
            </div>

            {/* Code example */}
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/6"></div>
              </div>
            </div>

            {/* Objectives */}
            <div className="space-y-2">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        );

      case "quiz":
        return (
          <div className="space-y-6">
            {/* Quiz question */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-5/6 mb-4"></div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/6"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                </div>
              </div>
            </div>

            {/* Explanation placeholder */}
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        );

      case "module":
        return (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex items-start space-x-4">
              <div className="h-16 w-16 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full px-3 py-1 w-20"></div>
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full px-3 py-1 w-24"></div>
            </div>
          </div>
        );

      case "card":
        return (
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6 mb-2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
          </div>
        );

      case "text":
      default:
        return (
          <div className="space-y-2">
            {[...Array(count)].map((_, i) => (
              <div
                key={i}
                className={`h-4 ${shimmerClasses} rounded`}
                style={{ width: `${Math.max(70, 100 - i * 10)}%` }}
              ></div>
            ))}
          </div>
        );
    }
  };

  return <div className={shimmerClasses}>{renderSkeleton()}</div>;
};

export default SkeletonLoader;
