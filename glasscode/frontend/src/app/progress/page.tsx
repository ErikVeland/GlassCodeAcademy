'use client'

import React from 'react';
import { CompleteProgressTracker } from '../../components/CompleteProgressTracker';
import BreadcrumbNavigation from '../../components/BreadcrumbNavigation';

const ProgressPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <BreadcrumbNavigation 
          items={[
            { name: 'Home', href: '/' },
            { name: 'Progress', href: '/progress' }
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