"use client";

import React from "react";
import Link from "next/link";
import CircularProgress from "./CircularProgress";
import CertificateAward from "./CertificateAward";

type QuizResultProps = {
  moduleName: string;
  score: number;
  total: number;
  onRetry: () => void;
  onNextLesson?: () => void;
  nextLessonHref?: string;
  nextModuleHref?: string;
  nextLessonTitle?: string;
  nextModuleTitle?: string;
  passThresholdPercent?: number; // default 70
};

const QuizResult: React.FC<QuizResultProps> = ({
  moduleName,
  score,
  total,
  onRetry,
  onNextLesson,
  nextLessonHref,
  nextModuleHref,
  nextLessonTitle,
  nextModuleTitle,
  passThresholdPercent = 70,
}) => {
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = percent >= passThresholdPercent;

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">
        Quiz Completed
      </h2>
      <div className="mb-6 flex flex-col items-center">
        <CircularProgress percent={percent} />
        <p className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-200">
          Score: {score}/{total} ({percent}%)
        </p>
        <p className="mt-1 text-gray-600 dark:text-gray-300">
          {passed
            ? `Great job! You have successfully passed the ${moduleName} quiz.`
            : `You need to score at least ${passThresholdPercent}% to pass. Keep learning and try again!`}
        </p>
      </div>

      {passed && (
        <div className="mt-10">
          <CertificateAward
            moduleName={moduleName}
            score={score}
            total={total}
            percent={percent}
          />
          <div className="mt-8 flex items-center justify-between">
            <div className="flex justify-start w-1/2">
              <button onClick={onRetry} className="btn btn-secondary">
                ← Try Again
              </button>
            </div>
            <div className="flex justify-end w-1/2">
              {(nextLessonHref || onNextLesson || nextModuleHref) &&
                (nextLessonHref ? (
                  <Link
                    href={nextLessonHref}
                    className="btn btn-success font-semibold"
                    aria-label="Start Next Lesson"
                  >
                    {nextLessonTitle
                      ? `Start ${nextLessonTitle}`
                      : "Start Next Lesson"}
                  </Link>
                ) : nextModuleHref ? (
                  <Link
                    href={nextModuleHref}
                    className="btn btn-success font-semibold"
                    aria-label="View Next Module"
                  >
                    {nextModuleTitle
                      ? `Start ${nextModuleTitle}`
                      : "Start Next Module"}
                  </Link>
                ) : (
                  <button
                    onClick={onNextLesson}
                    className="btn btn-success font-semibold"
                    aria-label="Start Next Lesson"
                  >
                    {nextLessonTitle
                      ? `Start ${nextLessonTitle}`
                      : "Start Next Lesson"}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
      {!passed && (
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <button onClick={onRetry} className="btn btn-primary">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizResult;
