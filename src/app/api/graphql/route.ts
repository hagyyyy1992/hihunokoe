import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { ApolloServer } from '@apollo/server'
import { NextRequest } from 'next/server'
import { typeDefs } from '@/graphql/schema'
import { resolvers } from '@/graphql/resolvers'
import { VerifyTokenUseCase } from '@api/usecases/auth/VerifyTokenUseCase'
import { AuthSessionRepositoryImpl } from '@api/interface-adapters/repositories/AuthSessionRepositoryImpl'
import { UserRepositoryImpl } from '@api/interface-adapters/repositories/UserRepositoryImpl'
import { TokenServiceImpl } from '@api/interface-adapters/services/TokenServiceImpl'
import type { GraphQLContext } from '@/graphql/context'

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  introspection: true,
  plugins: [
    {
      async serverWillStart() {
        console.log('GraphQL Server starting...')
      },
    },
  ],
})

const handler = startServerAndCreateNextHandler<NextRequest, GraphQLContext>(server, {
  context: async (req): Promise<GraphQLContext> => {
    const authHeader = req.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { userId: null }
    }

    const token = authHeader.substring(7)

    try {
      const authSessionRepository = new AuthSessionRepositoryImpl()
      const userRepository = new UserRepositoryImpl()
      const tokenService = new TokenServiceImpl()

      const verifyTokenUseCase = new VerifyTokenUseCase(
        authSessionRepository,
        userRepository,
        tokenService
      )

      const { user } = await verifyTokenUseCase.execute({ token })
      return { userId: user?.id || null }
    } catch {
      return { userId: null }
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
