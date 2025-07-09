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
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})
