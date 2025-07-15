import { Comment } from '@api/domain/entities/Comment'
import { User } from '@api/domain/entities/User'
import { NextResponse } from 'next/server'

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

export interface SuccessResponse<T = any> {
  success: true
  data?: T
  message?: string
}

export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
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

  static presentSuccess<T = any>(
    data?: T,
    message?: string,
    status: number = 200
  ): NextResponse<SuccessResponse<T>> {
    return NextResponse.json(
      {
        success: true,
        data,
        message,
      },
      { status }
    )
  }

  static presentCreated(
    comment: CommentResponse,
    message: string = 'コメントを投稿しました'
  ): NextResponse<SuccessResponse<CommentResponse>> {
    return this.presentSuccess(comment, message, 201)
  }

  static presentUpdated(
    comment: CommentResponse,
    message: string = 'コメントを更新しました'
  ): NextResponse<SuccessResponse<CommentResponse>> {
    return this.presentSuccess(comment, message, 200)
  }

  static presentDeleted(message: string = 'コメントを削除しました'): NextResponse<SuccessResponse> {
    return this.presentSuccess(undefined, message, 200)
  }

  static presentList(
    comments: CommentResponse[]
  ): NextResponse<SuccessResponse<CommentResponse[]>> {
    return this.presentSuccess(comments, undefined, 200)
  }

  static presentSingle(comment: CommentResponse): NextResponse<SuccessResponse<CommentResponse>> {
    return this.presentSuccess(comment, undefined, 200)
  }
}
