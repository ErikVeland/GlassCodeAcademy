'use client';

import { ApolloProvider } from '@apollo/client';
import { ReactNode, useState, useEffect } from 'react';
import { getApolloClient } from '../apolloClient';

export default function ApolloWrapper({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  // This ensures we only render Apollo Provider on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  const client = getApolloClient();
  
  return (
    <ApolloProvider client={client}>
      {mounted ? children : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      )}
    </ApolloProvider>
  );
}