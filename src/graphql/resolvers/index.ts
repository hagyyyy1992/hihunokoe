import { postResolvers } from './post'
import { userResolvers } from './user'
import { empathyResolvers } from './empathy'
import { commentResolvers } from './comment'
import { GraphQLScalarType, Kind } from 'graphql'
import type { Resolvers } from '@/generated/graphql'

const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'Date custom scalar type',
  serialize(value) {
    if (value instanceof Date) {
      return value.toISOString()
    }
    throw Error('GraphQL Date Scalar serializer expected a `Date` object')
  },
  parseValue(value) {
    if (typeof value === 'string') {
      return new Date(value)
    }
    throw new Error('GraphQL Date Scalar parser expected a `string`')
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value)
    }
    return null
  },
})

const jsonScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value) {
    return value
  },
  parseValue(value) {
    return value
  },
  parseLiteral(ast) {
    switch (ast.kind) {
      case Kind.STRING:
        return JSON.parse(ast.value)
      case Kind.OBJECT:
        return ast
      default:
        return null
    }
  },
})

export const resolvers: Resolvers = {
  DateTime: dateTimeScalar,
  JSON: jsonScalar,
  Query: {
    ...postResolvers.Query,
    ...userResolvers.Query,
  },
  Mutation: {
    ...postResolvers.Mutation,
    ...empathyResolvers.Mutation,
    ...commentResolvers.Mutation,
  },
  Post: postResolvers.Post,
  User: userResolvers.User,
  Empathy: empathyResolvers.Empathy,
  Comment: commentResolvers.Comment,
}
