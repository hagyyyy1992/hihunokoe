import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { ApolloServer } from '@apollo/server'
import { NextRequest } from 'next/server'
import { typeDefs } from '@/graphql/schema'
import { resolvers } from '@/graphql/resolvers'
import { AuthenticationUseCase } from '@api/usecases/auth/interactor'
import type { VerifyTokenInputPort } from '@api/usecases/auth/input-port'
import { UserRepository } from '@api/interface-adapters/repositories/User.repository'
import { AuthSessionRepository } from '@api/interface-adapters/repositories/AuthSession.repository'
import { PasswordHashServiceImpl } from '@api/interface-adapters/services/PasswordHashService'
import { TokenServiceImpl } from '@api/interface-adapters/services/TokenService'
import type { GraphQLContext } from '@/graphql/context'
import { createUserLoader } from '@/graphql/dataloaders/userDataLoader'
import {
  createCommentDataLoader,
  createCommentByIdDataLoader,
} from '@/graphql/dataloaders/commentDataLoader'
import {
  createEmpathyDataLoader,
  createUserEmpathyDataLoader,
} from '@/graphql/dataloaders/empathyDataLoader'

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  introspection: true,
  plugins: [
    {
      async serverWillStart() {},
    },
  ],
})

const handler = startServerAndCreateNextHandler<NextRequest, GraphQLContext>(server, {
  context: async (req): Promise<GraphQLContext> => {
    // Authorizationヘッダーから取得を試みる
    const authHeader = req.headers.get('authorization')
    let token: string | null = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else {
      // ヘッダーにない場合はクッキーから取得
      const cookieHeader = req.headers.get('cookie')
      if (cookieHeader) {
        const cookies = cookieHeader.split(';')
        const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='))
        if (authCookie) {
          token = authCookie.split('=')[1]
        }
      }
    }

    const userRepository = new UserRepository()
    const userLoader = createUserLoader(userRepository)
    const commentLoader = createCommentDataLoader()
    const commentByIdLoader = createCommentByIdDataLoader()
    const empathyLoader = createEmpathyDataLoader()
    let userId: string | null = null

    if (!token) {
      const userEmpathyLoader = createUserEmpathyDataLoader(null)
      return {
        userId: null,
        userLoader,
        commentLoader,
        commentByIdLoader,
        empathyLoader,
        userEmpathyLoader,
      }
    }

    try {
      const authSessionRepository = new AuthSessionRepository()
      const passwordHashService = new PasswordHashServiceImpl()
      const tokenService = new TokenServiceImpl()

      const authenticationUseCase = new AuthenticationUseCase(
        userRepository,
        authSessionRepository,
        passwordHashService,
        tokenService
      )

      const input: VerifyTokenInputPort = { token }
      const { user } = await authenticationUseCase.verifyToken(input)
      userId = user?.id || null
      const userEmpathyLoader = createUserEmpathyDataLoader(userId)

      return {
        userId,
        userLoader,
        commentLoader,
        commentByIdLoader,
        empathyLoader,
        userEmpathyLoader,
      }
    } catch (error) {
      console.error('GraphQL authentication error:', error)
      const userEmpathyLoader = createUserEmpathyDataLoader(null)
      return {
        userId: null,
        userLoader,
        commentLoader,
        commentByIdLoader,
        empathyLoader,
        userEmpathyLoader,
      }
    }
  },
})

export async function GET(request: NextRequest) {
  // GraphiQL IDE を表示
  if (request.headers.get('accept')?.includes('text/html')) {
    return new Response(
      `<!DOCTYPE html>
<html>
<head>
  <title>GraphiQL</title>
  <link rel="stylesheet" href="https://unpkg.com/graphiql/graphiql.min.css" />
  <script crossorigin src="https://unpkg.com/react/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom/umd/react-dom.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/graphiql/graphiql.min.js"></script>
</head>
<body style="margin: 0;">
  <div id="graphiql" style="height: 100vh;"></div>
  <script>
    const fetcher = GraphiQL.createFetcher({
      url: window.location.pathname,
    });
    ReactDOM.render(
      React.createElement(GraphiQL, { fetcher: fetcher }),
      document.getElementById('graphiql'),
    );
  </script>
</body>
</html>`,
      {
        headers: {
          'content-type': 'text/html',
        },
      }
    )
  }

  return handler(request)
}

export async function POST(request: NextRequest) {
  return handler(request)
}
