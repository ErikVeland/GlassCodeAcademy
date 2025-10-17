'use client';

import ApolloWrapper from '@/components/ApolloWrapper';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ApolloWrapper>{children}</ApolloWrapper>;
}