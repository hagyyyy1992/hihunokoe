import { Comment } from '@api/domain/entities/Comment'
import { User } from '@api/domain/entities/User'

export interface CommentResponse {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    userName: string
    skinType?: string
    profileImageUrl?: string
  }
  replies?: CommentResponse[]
  isEdited: boolean
  canEdit: boolean
  canDelete: boolean
}

export class CommentPresenter {
  static toResponse(
    comment: Comment,
    user: User,
    currentUserId?: string,
    replies?: { comment: Comment; user: User }[]
  ): CommentResponse {
    const isEdited = comment.createdAt.getTime() !== comment.updatedAt.getTime()
    const canEdit = currentUserId ? comment.canBeEditedBy(currentUserId) : false
    const canDelete = currentUserId ? comment.canBeDeletedBy(currentUserId) : false

    const response: CommentResponse = {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      user: {
        id: user.id,
        userName: user.userName,
        skinType: user.skinType || undefined,
        profileImageUrl: user.profileImageUrl || undefined,
      },
      isEdited,
      canEdit,
      canDelete,
    }

    if (replies && replies.length > 0) {
      response.replies = replies.map(reply =>
        this.toResponse(reply.comment, reply.user, currentUserId)
      )
    }

    return response
  }
}
