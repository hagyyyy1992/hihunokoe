import { gql } from 'graphql-tag'

// Define the schema directly in TypeScript to ensure it's included in the build
export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  type User {
    id: ID!
    email: String!
    displayName: String!
    profileImageUrl: String
    bio: String
    skinType: String
    allergyInfo: String
    createdAt: DateTime!
    updatedAt: DateTime!
    posts: [Post!]!
    empathies: [Empathy!]!
    comments: [Comment!]!
  }

  type Post {
    id: ID!
    userId: String!
    title: String!
    content: String!
    cosmeticName: String!
    cosmeticCategory: String
    skinType: String
    usageSituation: JSON
    experienceDetails: JSON
    moodTag: String
    status: String!
    viewCount: Int!
    empathyCount: Int!
    commentCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    publishedAt: DateTime
    user: User!
    comments: [Comment!]!
    empathies: [Empathy!]!
  }

  type Empathy {
    id: ID!
    postId: String!
    userId: String!
    empathyType: String!
    createdAt: DateTime!
    post: Post!
    user: User!
  }

  type Comment {
    id: ID!
    postId: String!
    userId: String!
    content: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    post: Post!
    user: User!
  }

  type PostConnection {
    edges: [PostEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type PostEdge {
    node: Post!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type CommentConnection {
    edges: [CommentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type CommentEdge {
    node: Comment!
    cursor: String!
  }

  type EmpathyConnection {
    edges: [EmpathyEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type EmpathyEdge {
    node: Empathy!
    cursor: String!
  }

  input CreatePostInput {
    title: String!
    content: String!
    cosmeticName: String!
    cosmeticCategory: String
    skinType: String
    usageSituation: JSON
    experienceDetails: JSON
    moodTag: String
  }

  input UpdatePostInput {
    title: String
    content: String
    cosmeticName: String
    cosmeticCategory: String
    skinType: String
    usageSituation: JSON
    experienceDetails: JSON
    moodTag: String
    status: String
  }

  input PostFilterInput {
    skinType: String
    cosmeticCategory: String
    moodTag: String
    search: String
  }

  type Query {
    # Post queries
    post(id: ID!): Post
    posts(
      first: Int
      after: String
      last: Int
      before: String
      filter: PostFilterInput
      orderBy: PostOrderBy
    ): PostConnection!

    # Paginated post comments and empathies
    postComments(postId: ID!, first: Int, after: String): CommentConnection!

    postEmpathies(postId: ID!, first: Int, after: String): EmpathyConnection!

    # User queries
    user(id: ID!): User
    currentUser: User
  }

  type Mutation {
    # Post mutations
    createPost(input: CreatePostInput!): Post!
    updatePost(id: ID!, input: UpdatePostInput!): Post!
    deletePost(id: ID!): Boolean!

    # Empathy mutations
    addEmpathy(postId: ID!, type: String!): Empathy!
    removeEmpathy(postId: ID!): Boolean!

    # Comment mutations
    addComment(postId: ID!, content: String!): Comment!
    updateComment(id: ID!, content: String!): Comment!
    deleteComment(id: ID!): Boolean!
  }

  enum PostOrderBy {
    CREATED_AT_DESC
    CREATED_AT_ASC
    EMPATHY_COUNT_DESC
    VIEW_COUNT_DESC
  }
`
