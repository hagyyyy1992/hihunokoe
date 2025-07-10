import { Comment } from '@api/domain/entities/Comment'

// Comment Management
export type CreateCommentOutputPort = {
  comment: Comment
  message: string
}

export type CreateReplyOutputPort = {
  comment: Comment
  message: string
}

export type UpdateCommentOutputPort = {
  comment: Comment
  message: string
}

export type DeleteCommentOutputPort = {
  commentId: string
  message: string
}

// Comment Retrieval
export type GetCommentOutputPort = {
  comment: Comment
}

export type GetCommentsOutputPort = {
  comments: Comment[]
  total: number
}

export type GetCommentsWithPaginationOutputPort = {
  comments: Comment[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}
