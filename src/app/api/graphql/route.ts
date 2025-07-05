import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { ApolloServer } from '@apollo/server'
import { NextRequest } from 'next/server'
import { typeDefs } from '@/graphql/schema'
import { resolvers } from '@/graphql/resolvers'
import { verifyToken } from '@/lib/auth/auth'
import type { GraphQLContext } from '@/graphql/context'

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
})

const handler = startServerAndCreateNextHandler<NextRequest>(server as ApolloServer<object>, {
  context: async (req: NextRequest): Promise<GraphQLContext> => {
    const authHeader = req.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { userId: null }
    }

    const token = authHeader.substring(7)

    try {
      const session = await verifyToken(token)
      return { userId: session?.id || null }
    } catch {
      return { userId: null }
    }
  },
})

export { handler as GET, handler as POST }
