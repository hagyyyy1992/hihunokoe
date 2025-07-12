import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql'
import {
  User as PrismaUser,
  Post as PrismaPost,
  Empathy as PrismaEmpathy,
  Comment as PrismaComment,
} from '@/lib/prisma'
import { GraphQLContext } from '@/graphql/context'
import { gql } from '@apollo/client'
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never
}
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never }
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string }
  String: { input: string; output: string }
  Boolean: { input: boolean; output: boolean }
  Int: { input: number; output: number }
  Float: { input: number; output: number }
  DateTime: { input: Date; output: Date }
  JSON: { input: Record<string, any>; output: Record<string, any> }
}

export type Comment = {
  __typename?: 'Comment'
  content: Scalars['String']['output']
  createdAt: Scalars['DateTime']['output']
  id: Scalars['ID']['output']
  post: Post
  postId: Scalars['String']['output']
  updatedAt: Scalars['DateTime']['output']
  user: User
  userId: Scalars['String']['output']
}

export type CommentConnection = {
  __typename?: 'CommentConnection'
  edges: Array<CommentEdge>
  pageInfo: PageInfo
  totalCount: Scalars['Int']['output']
}

export type CommentEdge = {
  __typename?: 'CommentEdge'
  cursor: Scalars['String']['output']
  node: Comment
}

export type CreatePostInput = {
  content: Scalars['String']['input']
  cosmeticCategory?: InputMaybe<Scalars['String']['input']>
  cosmeticName: Scalars['String']['input']
  experienceDetails?: InputMaybe<Scalars['JSON']['input']>
  moodTag?: InputMaybe<Scalars['String']['input']>
  skinType?: InputMaybe<Scalars['String']['input']>
  title: Scalars['String']['input']
  usageSituation?: InputMaybe<Scalars['JSON']['input']>
}

export type Empathy = {
  __typename?: 'Empathy'
  createdAt: Scalars['DateTime']['output']
  empathyType: Scalars['String']['output']
  id: Scalars['ID']['output']
  post: Post
  postId: Scalars['String']['output']
  user: User
  userId: Scalars['String']['output']
}

export type EmpathyConnection = {
  __typename?: 'EmpathyConnection'
  edges: Array<EmpathyEdge>
  pageInfo: PageInfo
  totalCount: Scalars['Int']['output']
}

export type EmpathyEdge = {
  __typename?: 'EmpathyEdge'
  cursor: Scalars['String']['output']
  node: Empathy
}

export type Mutation = {
  __typename?: 'Mutation'
  addComment: Comment
  addEmpathy: Empathy
  createPost: Post
  deleteComment: Scalars['Boolean']['output']
  deletePost: Scalars['Boolean']['output']
  removeEmpathy: Scalars['Boolean']['output']
  updateComment: Comment
  updatePost: Post
}

export type MutationAddCommentArgs = {
  content: Scalars['String']['input']
  postId: Scalars['ID']['input']
}

export type MutationAddEmpathyArgs = {
  postId: Scalars['ID']['input']
  type: Scalars['String']['input']
}

export type MutationCreatePostArgs = {
  input: CreatePostInput
}

export type MutationDeleteCommentArgs = {
  id: Scalars['ID']['input']
}

export type MutationDeletePostArgs = {
  id: Scalars['ID']['input']
}

export type MutationRemoveEmpathyArgs = {
  postId: Scalars['ID']['input']
}

export type MutationUpdateCommentArgs = {
  content: Scalars['String']['input']
  id: Scalars['ID']['input']
}

export type MutationUpdatePostArgs = {
  id: Scalars['ID']['input']
  input: UpdatePostInput
}

export type PageInfo = {
  __typename?: 'PageInfo'
  endCursor: Maybe<Scalars['String']['output']>
  hasNextPage: Scalars['Boolean']['output']
  hasPreviousPage: Scalars['Boolean']['output']
  startCursor: Maybe<Scalars['String']['output']>
}

export type Post = {
  __typename?: 'Post'
  commentCount: Scalars['Int']['output']
  comments: Array<Comment>
  content: Scalars['String']['output']
  cosmeticCategory: Maybe<Scalars['String']['output']>
  cosmeticName: Scalars['String']['output']
  createdAt: Scalars['DateTime']['output']
  empathies: Array<Empathy>
  empathyCount: Scalars['Int']['output']
  experienceDetails: Maybe<Scalars['JSON']['output']>
  id: Scalars['ID']['output']
  moodTag: Maybe<Scalars['String']['output']>
  publishedAt: Maybe<Scalars['DateTime']['output']>
  skinType: Maybe<Scalars['String']['output']>
  status: Scalars['String']['output']
  title: Scalars['String']['output']
  updatedAt: Scalars['DateTime']['output']
  usageSituation: Maybe<Scalars['JSON']['output']>
  user: User
  userId: Scalars['String']['output']
  viewCount: Scalars['Int']['output']
}

export type PostConnection = {
  __typename?: 'PostConnection'
  edges: Array<PostEdge>
  pageInfo: PageInfo
  totalCount: Scalars['Int']['output']
}

export type PostEdge = {
  __typename?: 'PostEdge'
  cursor: Scalars['String']['output']
  node: Post
}

export type PostFilterInput = {
  cosmeticCategory?: InputMaybe<Scalars['String']['input']>
  moodTag?: InputMaybe<Scalars['String']['input']>
  search?: InputMaybe<Scalars['String']['input']>
  skinType?: InputMaybe<Scalars['String']['input']>
}

export type PostOrderBy =
  | 'CREATED_AT_ASC'
  | 'CREATED_AT_DESC'
  | 'EMPATHY_COUNT_DESC'
  | 'VIEW_COUNT_DESC'

export type Query = {
  __typename?: 'Query'
  currentUser: Maybe<User>
  post: Maybe<Post>
  postComments: CommentConnection
  postEmpathies: EmpathyConnection
  posts: PostConnection
  user: Maybe<User>
}

export type QueryPostArgs = {
  id: Scalars['ID']['input']
}

export type QueryPostCommentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>
  first?: InputMaybe<Scalars['Int']['input']>
  postId: Scalars['ID']['input']
}

export type QueryPostEmpathiesArgs = {
  after?: InputMaybe<Scalars['String']['input']>
  first?: InputMaybe<Scalars['Int']['input']>
  postId: Scalars['ID']['input']
}

export type QueryPostsArgs = {
  after?: InputMaybe<Scalars['String']['input']>
  before?: InputMaybe<Scalars['String']['input']>
  filter?: InputMaybe<PostFilterInput>
  first?: InputMaybe<Scalars['Int']['input']>
  last?: InputMaybe<Scalars['Int']['input']>
  orderBy?: InputMaybe<PostOrderBy>
}

export type QueryUserArgs = {
  id: Scalars['ID']['input']
}

export type UpdatePostInput = {
  content?: InputMaybe<Scalars['String']['input']>
  cosmeticCategory?: InputMaybe<Scalars['String']['input']>
  cosmeticName?: InputMaybe<Scalars['String']['input']>
  experienceDetails?: InputMaybe<Scalars['JSON']['input']>
  moodTag?: InputMaybe<Scalars['String']['input']>
  skinType?: InputMaybe<Scalars['String']['input']>
  status?: InputMaybe<Scalars['String']['input']>
  title?: InputMaybe<Scalars['String']['input']>
  usageSituation?: InputMaybe<Scalars['JSON']['input']>
}

export type User = {
  __typename?: 'User'
  allergyInfo: Maybe<Scalars['String']['output']>
  bio: Maybe<Scalars['String']['output']>
  comments: Array<Comment>
  createdAt: Scalars['DateTime']['output']
  displayName: Scalars['String']['output']
  email: Scalars['String']['output']
  empathies: Array<Empathy>
  id: Scalars['ID']['output']
  posts: Array<Post>
  profileImageUrl: Maybe<Scalars['String']['output']>
  skinType: Maybe<Scalars['String']['output']>
  updatedAt: Scalars['DateTime']['output']
}

export type WithIndex<TObject> = TObject & Record<string, any>
export type ResolversObject<TObject> = WithIndex<TObject>

export type ResolverTypeWrapper<T> = Promise<T> | T

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = {},
  TContext = {},
  TArgs = {},
> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
  obj: T,
  context: TContext,
  info: GraphQLResolveInfo
) => boolean | Promise<boolean>

export type NextResolverFn<T> = () => Promise<T>

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>
  Comment: ResolverTypeWrapper<PrismaComment>
  CommentConnection: ResolverTypeWrapper<
    Omit<CommentConnection, 'edges'> & { edges: Array<ResolversTypes['CommentEdge']> }
  >
  CommentEdge: ResolverTypeWrapper<Omit<CommentEdge, 'node'> & { node: ResolversTypes['Comment'] }>
  CreatePostInput: CreatePostInput
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>
  Empathy: ResolverTypeWrapper<PrismaEmpathy>
  EmpathyConnection: ResolverTypeWrapper<
    Omit<EmpathyConnection, 'edges'> & { edges: Array<ResolversTypes['EmpathyEdge']> }
  >
  EmpathyEdge: ResolverTypeWrapper<Omit<EmpathyEdge, 'node'> & { node: ResolversTypes['Empathy'] }>
  ID: ResolverTypeWrapper<Scalars['ID']['output']>
  Int: ResolverTypeWrapper<Scalars['Int']['output']>
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>
  Mutation: ResolverTypeWrapper<{}>
  PageInfo: ResolverTypeWrapper<PageInfo>
  Post: ResolverTypeWrapper<PrismaPost>
  PostConnection: ResolverTypeWrapper<
    Omit<PostConnection, 'edges'> & { edges: Array<ResolversTypes['PostEdge']> }
  >
  PostEdge: ResolverTypeWrapper<Omit<PostEdge, 'node'> & { node: ResolversTypes['Post'] }>
  PostFilterInput: PostFilterInput
  PostOrderBy: PostOrderBy
  Query: ResolverTypeWrapper<{}>
  String: ResolverTypeWrapper<Scalars['String']['output']>
  UpdatePostInput: UpdatePostInput
  User: ResolverTypeWrapper<PrismaUser>
}>

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Boolean: Scalars['Boolean']['output']
  Comment: PrismaComment
  CommentConnection: Omit<CommentConnection, 'edges'> & {
    edges: Array<ResolversParentTypes['CommentEdge']>
  }
  CommentEdge: Omit<CommentEdge, 'node'> & { node: ResolversParentTypes['Comment'] }
  CreatePostInput: CreatePostInput
  DateTime: Scalars['DateTime']['output']
  Empathy: PrismaEmpathy
  EmpathyConnection: Omit<EmpathyConnection, 'edges'> & {
    edges: Array<ResolversParentTypes['EmpathyEdge']>
  }
  EmpathyEdge: Omit<EmpathyEdge, 'node'> & { node: ResolversParentTypes['Empathy'] }
  ID: Scalars['ID']['output']
  Int: Scalars['Int']['output']
  JSON: Scalars['JSON']['output']
  Mutation: {}
  PageInfo: PageInfo
  Post: PrismaPost
  PostConnection: Omit<PostConnection, 'edges'> & { edges: Array<ResolversParentTypes['PostEdge']> }
  PostEdge: Omit<PostEdge, 'node'> & { node: ResolversParentTypes['Post'] }
  PostFilterInput: PostFilterInput
  Query: {}
  String: Scalars['String']['output']
  UpdatePostInput: UpdatePostInput
  User: PrismaUser
}>

export type CommentResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['Comment'] = ResolversParentTypes['Comment'],
> = ResolversObject<{
  content?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>
  post?: Resolver<ResolversTypes['Post'], ParentType, ContextType>
  postId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}>

export type CommentConnectionResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes['CommentConnection'] = ResolversParentTypes['CommentConnection'],
> = ResolversObject<{
  edges?: Resolver<Array<ResolversTypes['CommentEdge']>, ParentType, ContextType>
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}>

export type CommentEdgeResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['CommentEdge'] = ResolversParentTypes['CommentEdge'],
> = ResolversObject<{
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  node?: Resolver<ResolversTypes['Comment'], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}>

export interface DateTimeScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime'
}

export type EmpathyResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['Empathy'] = ResolversParentTypes['Empathy'],
> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
  empathyType?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>
  post?: Resolver<ResolversTypes['Post'], ParentType, ContextType>
  postId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}>

export type EmpathyConnectionResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes['EmpathyConnection'] = ResolversParentTypes['EmpathyConnection'],
> = ResolversObject<{
  edges?: Resolver<Array<ResolversTypes['EmpathyEdge']>, ParentType, ContextType>
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}>

export type EmpathyEdgeResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['EmpathyEdge'] = ResolversParentTypes['EmpathyEdge'],
> = ResolversObject<{
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  node?: Resolver<ResolversTypes['Empathy'], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}>

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON'
}

export type MutationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation'],
> = ResolversObject<{
  addComment?: Resolver<
    ResolversTypes['Comment'],
    ParentType,
    ContextType,
    RequireFields<MutationAddCommentArgs, 'content' | 'postId'>
  >
  addEmpathy?: Resolver<
    ResolversTypes['Empathy'],
    ParentType,
    ContextType,
    RequireFields<MutationAddEmpathyArgs, 'postId' | 'type'>
  >
  createPost?: Resolver<
    ResolversTypes['Post'],
    ParentType,
    ContextType,
    RequireFields<MutationCreatePostArgs, 'input'>
  >
  deleteComment?: Resolver<
    ResolversTypes['Boolean'],
    ParentType,
    ContextType,
    RequireFields<MutationDeleteCommentArgs, 'id'>
  >
  deletePost?: Resolver<
    ResolversTypes['Boolean'],
    ParentType,
    ContextType,
    RequireFields<MutationDeletePostArgs, 'id'>
  >
  removeEmpathy?: Resolver<
    ResolversTypes['Boolean'],
    ParentType,
    ContextType,
    RequireFields<MutationRemoveEmpathyArgs, 'postId'>
  >
  updateComment?: Resolver<
    ResolversTypes['Comment'],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateCommentArgs, 'content' | 'id'>
  >
  updatePost?: Resolver<
    ResolversTypes['Post'],
    ParentType,
    ContextType,
    RequireFields<MutationUpdatePostArgs, 'id' | 'input'>
  >
}>

export type PageInfoResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo'],
> = ResolversObject<{
  endCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
  startCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}>

export type PostResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['Post'] = ResolversParentTypes['Post'],
> = ResolversObject<{
  commentCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
  comments?: Resolver<Array<ResolversTypes['Comment']>, ParentType, ContextType>
  content?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  cosmeticCategory?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
  cosmeticName?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
  empathies?: Resolver<Array<ResolversTypes['Empathy']>, ParentType, ContextType>
  empathyCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
  experienceDetails?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>
  moodTag?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
  publishedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>
  skinType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
  usageSituation?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  viewCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}>

export type PostConnectionResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes['PostConnection'] = ResolversParentTypes['PostConnection'],
> = ResolversObject<{
  edges?: Resolver<Array<ResolversTypes['PostEdge']>, ParentType, ContextType>
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}>

export type PostEdgeResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['PostEdge'] = ResolversParentTypes['PostEdge'],
> = ResolversObject<{
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  node?: Resolver<ResolversTypes['Post'], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}>

export type QueryResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query'],
> = ResolversObject<{
  currentUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>
  post?: Resolver<
    Maybe<ResolversTypes['Post']>,
    ParentType,
    ContextType,
    RequireFields<QueryPostArgs, 'id'>
  >
  postComments?: Resolver<
    ResolversTypes['CommentConnection'],
    ParentType,
    ContextType,
    RequireFields<QueryPostCommentsArgs, 'postId'>
  >
  postEmpathies?: Resolver<
    ResolversTypes['EmpathyConnection'],
    ParentType,
    ContextType,
    RequireFields<QueryPostEmpathiesArgs, 'postId'>
  >
  posts?: Resolver<
    ResolversTypes['PostConnection'],
    ParentType,
    ContextType,
    Partial<QueryPostsArgs>
  >
  user?: Resolver<
    Maybe<ResolversTypes['User']>,
    ParentType,
    ContextType,
    RequireFields<QueryUserArgs, 'id'>
  >
}>

export type UserResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User'],
> = ResolversObject<{
  allergyInfo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
  bio?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
  comments?: Resolver<Array<ResolversTypes['Comment']>, ParentType, ContextType>
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
  displayName?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  empathies?: Resolver<Array<ResolversTypes['Empathy']>, ParentType, ContextType>
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>
  posts?: Resolver<Array<ResolversTypes['Post']>, ParentType, ContextType>
  profileImageUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
  skinType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}>

export type Resolvers<ContextType = GraphQLContext> = ResolversObject<{
  Comment?: CommentResolvers<ContextType>
  CommentConnection?: CommentConnectionResolvers<ContextType>
  CommentEdge?: CommentEdgeResolvers<ContextType>
  DateTime?: GraphQLScalarType
  Empathy?: EmpathyResolvers<ContextType>
  EmpathyConnection?: EmpathyConnectionResolvers<ContextType>
  EmpathyEdge?: EmpathyEdgeResolvers<ContextType>
  JSON?: GraphQLScalarType
  Mutation?: MutationResolvers<ContextType>
  PageInfo?: PageInfoResolvers<ContextType>
  Post?: PostResolvers<ContextType>
  PostConnection?: PostConnectionResolvers<ContextType>
  PostEdge?: PostEdgeResolvers<ContextType>
  Query?: QueryResolvers<ContextType>
  User?: UserResolvers<ContextType>
}>
