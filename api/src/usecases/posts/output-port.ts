import { Post } from '@api/domain/entities/Post'
import { Empathy } from '@api/domain/entities/Empathy'

// Post Management
export type CreatePostOutputPort = {
  post: Post
  message: string
}

export type UpdatePostOutputPort = {
  post: Post
  message: string
}

export type DeletePostOutputPort = {
  postId: string
  message: string
}

// Post Retrieval
export type GetPostOutputPort = {
  post: Post
  empathyCount: number
  commentCount: number
  userHasEmpathy?: boolean
}

export type GetPostsOutputPort = {
  posts: Array<
    Post & {
      empathyCount: number
      commentCount: number
      userHasEmpathy?: boolean
    }
  >
  total: number
  page: number
  limit: number
  hasNext: boolean
}

// Empathy Management
export type AddEmpathyOutputPort = {
  empathy: Empathy
  message: string
}

export type RemoveEmpathyOutputPort = {
  message: string
}

export type GetEmpathyStatusOutputPort = {
  hasEmpathy: boolean
  empathyCount: number
}
