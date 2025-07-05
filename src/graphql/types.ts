// GraphQL resolver types
export interface GraphQLContext {
  userId?: string
}

export interface PostInput {
  title: string
  content: string
  cosmeticName: string
  cosmeticCategory?: string
  skinType?: string
  moodTag?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  usageSituation?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  experienceDetails?: any
}

export interface PostFilter {
  skinType?: string
  cosmeticCategory?: string
  moodTag?: string
  search?: string
}

export interface PaginationArgs {
  first?: number
  after?: string
  last?: number
  before?: string
}

export interface PostArgs extends PaginationArgs {
  filter?: PostFilter
  orderBy?: string
}

export interface PostWithRelations {
  id: string
  title: string
  content: string
  cosmeticName: string
  cosmeticCategory?: string | null
  skinType?: string | null
  moodTag?: string | null
  usageSituation?: unknown
  experienceDetails?: unknown
  user: unknown
  comments?: unknown[]
  empathies?: unknown[]
}

export interface ResolverParent {
  user?: unknown
  post?: unknown
  comments?: unknown[]
  empathies?: unknown[]
  posts?: unknown[]
}
