import React from 'react';
import ApolloWrapper from '@/components/ApolloWrapper';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ApolloWrapper>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {children}
      </div>
    </ApolloWrapper>
  );
}