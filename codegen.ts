import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  overwrite: true,
  schema: './src/graphql/schemas/schema.graphql',
  documents: [
    'src/graphql/schemas/*.graphql',
    'src/**/*.tsx',
    'src/**/*.ts',
    '!src/generated/**/*',
  ],
  generates: {
    'src/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-resolvers',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        withHooks: true,
        withHOC: false,
        withComponent: false,
        scalars: {
          DateTime: 'Date',
          JSON: 'Record<string, any>',
        },
        mappers: {
          User: '@/lib/prisma#User as PrismaUser',
          Post: '@/lib/prisma#Post as PrismaPost',
          Empathy: '@/lib/prisma#Empathy as PrismaEmpathy',
          Comment: '@/lib/prisma#Comment as PrismaComment',
        },
        contextType: '@/graphql/context#GraphQLContext',
        enumsAsTypes: true,
        useIndexSignature: true,
        avoidOptionals: {
          field: true,
          inputValue: false,
          object: false,
          defaultValue: false,
        },
      },
    },
    'src/generated/': {
      preset: 'client',
      documents: ['src/graphql/schemas/*.graphql'],
      config: {
        scalars: {
          DateTime: 'Date',
          JSON: 'Record<string, any>',
        },
      },
    },
  },
}

export default config
