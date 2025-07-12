import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'

const httpLink = createHttpLink({
  uri: '/api/graphql',
  credentials: 'same-origin', // クッキーを含める
})

const authLink = setContext((_, { headers }) => {
  // localStorageから認証トークンを取得
  let token = null
  if (typeof window !== 'undefined') {
    // ブラウザ環境でlocalStorageから取得
    token = localStorage.getItem('token')

    // Fallback: クッキーからも試みる
    if (!token) {
      const cookies = document.cookie.split(';')
      const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='))
      if (authCookie) {
        token = authCookie.split('=')[1]
      }
    }
  }

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          posts: {
            keyArgs: ['filter', 'orderBy'],
            merge(existing, incoming) {
              if (!existing) return incoming

              // フィルターが変わった場合は新しいデータで置き換え
              if (!existing.edges || !incoming.edges) return incoming

              return {
                ...incoming,
                edges: [...existing.edges, ...incoming.edges],
              }
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-first',
      nextFetchPolicy: 'cache-first',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
  },
})
