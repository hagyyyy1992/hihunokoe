import { NextRequest, NextResponse } from 'next/server'
import {
  CommentManagementUseCase,
  CommentRetrievalUseCase,
} from '@api/usecases/comments/interactor'
import type {
  CreateCommentInputPort,
  CreateReplyInputPort,
  UpdateCommentInputPort,
  DeleteCommentInputPort,
  GetCommentInputPort,
  GetCommentsInputPort,
  GetCommentsWithPaginationInputPort,
} from '@api/usecases/comments/input-port'
import type { TokenService } from '@api/domain/services/TokenService'
import type { IUserRepository } from '@api/domain/repositories/UserRepository'
import type { ICommentRepository } from '@api/domain/repositories/CommentRepository'
import { CommentPresenter } from '@api/framework/presenters/CommentPresenter'
import { CommentValidator } from '@api/framework/validators/CommentValidator'
import { ErrorHandler } from '@api/framework/errors/ErrorHandler'
import { ApplicationError } from '@api/framework/errors/ApplicationError'
import { Comment } from '@api/domain/entities/Comment'
import { User } from '@api/domain/entities/User'

export class CommentController {
  constructor(
    private commentManagementUseCase: CommentManagementUseCase,
    private commentRetrievalUseCase: CommentRetrievalUseCase,
    private tokenService: TokenService,
    private userRepository: IUserRepository,
    private commentRepository: ICommentRepository
  ) {}

  private async getUserIdFromRequest(request: NextRequest): Promise<string | null> {
    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      try {
        const decoded = await this.tokenService.verifyToken(token)
        return decoded.userId
      } catch {
        return null
      }
    }

    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim())
      const authCookie = cookies.find(c => c.startsWith('auth-token='))
      if (authCookie) {
        const token = authCookie.split('=')[1]
        try {
          const decoded = await this.tokenService.verifyToken(token)
          return decoded.userId
        } catch {
          return null
        }
      }
    }

    return null
  }

  private async requireAuth(request: NextRequest): Promise<string> {
    const userId = await this.getUserIdFromRequest(request)
    if (!userId) {
      throw ApplicationError.unauthorized()
    }
    return userId
  }

  async createComment(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.requireAuth(request)

      const url = new URL(request.url)
      const postId = CommentValidator.validatePostId(url.searchParams.get('id'))

      const body = await request.json()
      const validatedData = CommentValidator.validateCreateComment({
        ...body,
        postId,
      })

      const input: CreateCommentInputPort = {
        postId: validatedData.postId,
        userId,
        content: validatedData.content,
      }

      const result = await this.commentManagementUseCase.createComment(input)
      // ユーザー情報を取得
      const user = await this.userRepository.findById(result.comment.userId)
      if (!user) {
        throw ApplicationError.notFound('ユーザー')
      }
      const comment = CommentPresenter.toResponse(result.comment, user, userId)

      return CommentPresenter.presentCreated(comment)
    } catch (error) {
      return ErrorHandler.handle(error)
    }
  }

  async createReply(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.requireAuth(request)

      const url = new URL(request.url)
      const parentId = CommentValidator.validateCommentId(url.searchParams.get('id'))

      const body = await request.json()
      const validatedData = CommentValidator.validateCreateComment({
        ...body,
        postId: 'dummy', // Will be retrieved from parent comment
      })

      const input: CreateReplyInputPort = {
        parentCommentId: parentId,
        userId,
        content: validatedData.content,
      }

      const result = await this.commentManagementUseCase.createReply(input)
      // ユーザー情報を取得
      const user = await this.userRepository.findById(result.comment.userId)
      if (!user) {
        throw ApplicationError.notFound('ユーザー')
      }
      const comment = CommentPresenter.toResponse(result.comment, user, userId)

      return CommentPresenter.presentCreated(comment, '返信を投稿しました')
    } catch (error) {
      return ErrorHandler.handle(error)
    }
  }

  async updateComment(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.requireAuth(request)

      const url = new URL(request.url)
      const commentId = CommentValidator.validateCommentId(url.searchParams.get('id'))

      const body = await request.json()
      const validatedData = CommentValidator.validateUpdateComment(body)

      const input: UpdateCommentInputPort = {
        commentId,
        userId,
        content: validatedData.content,
      }

      const result = await this.commentManagementUseCase.updateComment(input)
      // ユーザー情報を取得
      const user = await this.userRepository.findById(result.comment.userId)
      if (!user) {
        throw ApplicationError.notFound('ユーザー')
      }
      const comment = CommentPresenter.toResponse(result.comment, user, userId)

      return CommentPresenter.presentUpdated(comment)
    } catch (error) {
      return ErrorHandler.handle(error)
    }
  }

  async deleteComment(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.requireAuth(request)

      const url = new URL(request.url)
      const commentId = CommentValidator.validateCommentId(url.searchParams.get('id'))

      const input: DeleteCommentInputPort = {
        commentId,
        userId,
      }

      await this.commentManagementUseCase.deleteComment(input)

      return CommentPresenter.presentDeleted()
    } catch (error) {
      return ErrorHandler.handle(error)
    }
  }

  async getComment(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getUserIdFromRequest(request)

      const url = new URL(request.url)
      const commentId = CommentValidator.validateCommentId(url.searchParams.get('id'))

      const input: GetCommentInputPort = {
        commentId,
        userId: userId || undefined,
      }

      const result = await this.commentRetrievalUseCase.getComment(input)

      // ユーザー情報を取得
      const user = await this.userRepository.findById(result.comment.userId)
      if (!user) {
        throw ApplicationError.notFound('ユーザー')
      }

      // 返信を取得
      const replies = await this.commentRepository.findRepliesByParentId(result.comment.id)
      const repliesWithUsers: Array<{ comment: Comment; user: User }> = []

      for (const reply of replies) {
        const replyUser = await this.userRepository.findById(reply.userId)
        if (replyUser) {
          repliesWithUsers.push({ comment: reply, user: replyUser })
        }
      }

      const comment = CommentPresenter.toResponse(
        result.comment,
        user,
        userId || undefined,
        repliesWithUsers
      )

      return CommentPresenter.presentSingle(comment)
    } catch (error) {
      return ErrorHandler.handle(error)
    }
  }

  async getComments(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getUserIdFromRequest(request)

      const url = new URL(request.url)
      const postId = CommentValidator.validatePostId(url.searchParams.get('postId'))

      const input: GetCommentsInputPort = {
        postId,
        userId: userId || undefined,
      }

      const result = await this.commentRetrievalUseCase.getComments(input)
      const comments: Array<any> = []

      // 各コメントに対してユーザー情報と返信を取得
      for (const comment of result.comments) {
        const user = await this.userRepository.findById(comment.userId)
        if (!user) continue

        const replies = await this.commentRepository.findRepliesByParentId(comment.id)
        const repliesWithUsers: Array<{ comment: Comment; user: User }> = []

        for (const reply of replies) {
          const replyUser = await this.userRepository.findById(reply.userId)
          if (replyUser) {
            repliesWithUsers.push({ comment: reply, user: replyUser })
          }
        }

        const formatted = CommentPresenter.toResponse(
          comment,
          user,
          userId || undefined,
          repliesWithUsers
        )
        comments.push(formatted)
      }

      return CommentPresenter.presentList(comments)
    } catch (error) {
      return ErrorHandler.handle(error)
    }
  }

  async getCommentsWithPagination(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getUserIdFromRequest(request)

      const url = new URL(request.url)
      const postId = CommentValidator.validatePostId(url.searchParams.get('postId'))

      const page = parseInt(url.searchParams.get('page') || '1', 10)
      const limit = parseInt(url.searchParams.get('limit') || '20', 10)

      if (page < 1 || limit < 1 || limit > 100) {
        throw ApplicationError.validationError([
          'ページと件数は正の整数で、件数は100以下である必要があります',
        ])
      }

      const input: GetCommentsWithPaginationInputPort = {
        postId,
        page,
        limit,
        userId: userId || undefined,
      }

      const result = await this.commentRetrievalUseCase.getCommentsWithPagination(input)

      const comments: Array<any> = []

      // 各コメントに対してユーザー情報と返信を取得
      for (const comment of result.comments) {
        const user = await this.userRepository.findById(comment.userId)
        if (!user) continue

        const replies = await this.commentRepository.findRepliesByParentId(comment.id)
        const repliesWithUsers: Array<{ comment: Comment; user: User }> = []

        for (const reply of replies) {
          const replyUser = await this.userRepository.findById(reply.userId)
          if (replyUser) {
            repliesWithUsers.push({ comment: reply, user: replyUser })
          }
        }

        const formatted = CommentPresenter.toResponse(
          comment,
          user,
          userId || undefined,
          repliesWithUsers
        )
        comments.push(formatted)
      }

      const totalPages = Math.ceil(result.total / limit)
      const hasNextPage = page < totalPages
      const hasPreviousPage = page > 1

      return NextResponse.json({
        success: true,
        data: comments,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: result.total,
          hasNextPage,
          hasPreviousPage,
        },
      })
    } catch (error) {
      return ErrorHandler.handle(error)
    }
  }
}
