'use client'

import { ApolloProvider as BaseApolloProvider } from '@apollo/client'
import { apolloClient } from '@/lib/apollo-client'
import { useEffect } from 'react'

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('ApolloProvider initialized with client:', apolloClient)
  }, [])

  return <BaseApolloProvider client={apolloClient}>{children}</BaseApolloProvider>
}
