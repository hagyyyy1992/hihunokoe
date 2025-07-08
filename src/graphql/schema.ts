import { loadSchemaSync } from '@graphql-tools/load'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { join } from 'path'

export const typeDefs = loadSchemaSync(join(process.cwd(), 'src/graphql/schemas/*.graphql'), {
  loaders: [new GraphQLFileLoader()],
})
