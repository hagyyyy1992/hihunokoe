import { Post } from '@api/domain/entities/Post'
import { User } from '@api/domain/entities/User'
import { Empathy } from '@api/domain/entities/Empathy'

// Post Management
export type CreatePostOutputPort = {
  post: Post
  user: User
  empathyCount: number
  commentCount: number
  message: string
}

export type UpdatePostOutputPort = {
  post: Post
  user: User
  empathyCount: number
  commentCount: number
  userHasEmpathy: boolean
  message: string
}

export type DeletePostOutputPort = {
  postId: string
  message: string
}

// Post Retrieval
export type GetPostOutputPort = {
  post: Post
  user: User
  empathyCount: number
  commentCount: number
  userHasEmpathy?: boolean
}

export type PostWithMetadata = Post & {
  user: User
  userHasEmpathy?: boolean
}

export type GetPostsOutputPort = {
  posts: PostWithMetadata[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}

// Empathy Management
export type AddEmpathyOutputPort = {
  empathy: Empathy
  totalCount: number
  message: string
}

export type RemoveEmpathyOutputPort = {
  totalCount: number
  message: string
}

export type GetEmpathyStatusOutputPort = {
  hasEmpathy: boolean
  empathyCount: number
}
