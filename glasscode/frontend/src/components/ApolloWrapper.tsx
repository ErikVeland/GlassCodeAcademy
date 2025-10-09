'use client';

import { ApolloProvider } from '@apollo/client';
import { ReactNode } from 'react';
import { getApolloClient } from '../apolloClient';

export default function ApolloWrapper({ children }: { children: ReactNode }) {
  const client = getApolloClient();
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
}