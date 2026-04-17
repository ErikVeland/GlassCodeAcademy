'use client';

import React from 'react';
import { CompleteProgressTracker } from '../../components/CompleteProgressTracker';
import BreadcrumbNavigation from '../../components/BreadcrumbNavigation';

const ProgressPage: React.FC = () => {
  return (
    <div className="page-ambient min-h-screen text-white">
      <div className="container mx-auto px-4 py-8">
        <BreadcrumbNavigation
          items={[
            { name: 'Home', href: '/' },
            { name: 'Progress', href: '/progress' },
          ]}
        />

        <div className="mt-8">
          <CompleteProgressTracker />
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
