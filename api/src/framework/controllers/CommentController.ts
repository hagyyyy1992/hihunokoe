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
import { CommentRepositoryImpl } from '@api/interface-adapters/repositories/CommentRepositoryImpl'
import { PostRepositoryImpl } from '@api/interface-adapters/repositories/PostRepositoryImpl'
import { UserRepositoryImpl } from '@api/interface-adapters/repositories/UserRepositoryImpl'
import { TokenServiceImpl } from '@api/interface-adapters/services/TokenServiceImpl'
import { RateLimitServiceImpl } from '@api/interface-adapters/services/RateLimitServiceImpl'
import { CommentPresenter } from '@api/framework/presenters/CommentPresenter'

export class CommentController {
  private commentManagementUseCase: CommentManagementUseCase
  private commentRetrievalUseCase: CommentRetrievalUseCase
  private tokenService: TokenServiceImpl

  constructor() {
    const commentRepository = new CommentRepositoryImpl()
    const postRepository = new PostRepositoryImpl()
    const userRepository = new UserRepositoryImpl()
    this.tokenService = new TokenServiceImpl()
    const rateLimitService = new RateLimitServiceImpl()

    this.commentManagementUseCase = new CommentManagementUseCase(
      commentRepository,
      postRepository,
      userRepository,
      rateLimitService
    )
    this.commentRetrievalUseCase = new CommentRetrievalUseCase(commentRepository)
  }

  private async getUserIdFromRequest(request: NextRequest): Promise<string | null> {
    // First try Authorization header
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

    // Then try cookie-based authentication (for legacy compatibility)
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

  async createComment(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getUserIdFromRequest(request)
      if (!userId) {
        return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
      }

      const url = new URL(request.url)
      const postId = url.searchParams.get('id')

      if (!postId) {
        return NextResponse.json({ error: '投稿IDが指定されていません' }, { status: 400 })
      }

      const body = await request.json()
      const { content } = body

      const input: CreateCommentInputPort = {
        postId,
        userId,
        content,
      }

      const result = await this.commentManagementUseCase.createComment(input)

      return NextResponse.json({
        success: true,
        comment: result.comment,
        message: 'コメントを投稿しました',
      })
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'コメント内容は必須です' ||
          error.message === 'コメントは1000文字以内で入力してください'
        ) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        if (error.message === '投稿が見つかりませんでした') {
          return NextResponse.json({ error: error.message }, { status: 404 })
        }
        if (error.message === 'この投稿にはコメントできません') {
          return NextResponse.json({ error: error.message }, { status: 403 })
        }
        if (error.message === 'ユーザーが見つかりませんでした') {
          return NextResponse.json({ error: 'トークンが無効です' }, { status: 401 })
        }
        if (error.message === '投稿間隔を空けてください（5秒に1回まで）') {
          return NextResponse.json({ error: error.message }, { status: 429 })
        }
      }

      console.error('Create comment error:', error)
      return NextResponse.json({ error: 'コメントの投稿に失敗しました' }, { status: 500 })
    }
  }

  async createReply(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getUserIdFromRequest(request)
      if (!userId) {
        return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
      }

      const url = new URL(request.url)
      const parentCommentId = url.searchParams.get('id')

      if (!parentCommentId) {
        return NextResponse.json({ error: '親コメントIDが指定されていません' }, { status: 400 })
      }

      const body = await request.json()
      const { content } = body

      const input: CreateReplyInputPort = {
        parentCommentId,
        userId,
        content,
      }

      const result = await this.commentManagementUseCase.createReply(input)

      return NextResponse.json({
        success: true,
        comment: result.comment,
        message: '返信を投稿しました',
      })
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'コメント内容は必須です' ||
          error.message === 'コメントは1000文字以内で入力してください'
        ) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        if (error.message === 'コメントが見つかりませんでした') {
          return NextResponse.json({ error: error.message }, { status: 404 })
        }
        if (error.message === 'このコメントは削除されています') {
          return NextResponse.json({ error: error.message }, { status: 404 })
        }
        if (error.message === '返信は2階層までしか投稿できません') {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        if (error.message === 'この投稿にはコメントできません') {
          return NextResponse.json({ error: error.message }, { status: 403 })
        }
        if (error.message === 'ユーザーが見つかりませんでした') {
          return NextResponse.json({ error: 'トークンが無効です' }, { status: 401 })
        }
      }

      console.error('Create reply error:', error)
      return NextResponse.json({ error: '返信の投稿に失敗しました' }, { status: 500 })
    }
  }

  async updateComment(
    request: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const userId = await this.getUserIdFromRequest(request)
      if (!userId) {
        return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
      }

      const commentId = context.params.id
      const body = await request.json()
      const { content } = body

      const input: UpdateCommentInputPort = {
        commentId,
        userId,
        content,
      }

      const result = await this.commentManagementUseCase.updateComment(input)

      return NextResponse.json({
        success: true,
        comment: result.comment,
        message: 'コメントを更新しました',
      })
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'コメント内容は必須です' ||
          error.message === 'コメントは1000文字以内で入力してください'
        ) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        if (error.message === 'コメントが見つかりませんでした') {
          return NextResponse.json({ error: error.message }, { status: 404 })
        }
        if (error.message === 'このコメントを編集する権限がありません') {
          return NextResponse.json({ error: error.message }, { status: 403 })
        }
        if (error.message === 'コメントの更新に失敗しました') {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
      }

      console.error('Update comment error:', error)
      return NextResponse.json({ error: 'コメントの更新に失敗しました' }, { status: 500 })
    }
  }

  async deleteComment(
    request: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const userId = await this.getUserIdFromRequest(request)
      if (!userId) {
        return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
      }

      const commentId = context.params.id

      const input: DeleteCommentInputPort = {
        commentId,
        userId,
      }

      const result = await this.commentManagementUseCase.deleteComment(input)

      return NextResponse.json({
        success: true,
        message: 'コメントを削除しました',
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'コメントが見つかりませんでした') {
          return NextResponse.json({ error: error.message }, { status: 404 })
        }
        if (error.message === 'このコメントを削除する権限がありません') {
          return NextResponse.json({ error: error.message }, { status: 403 })
        }
        if (error.message === 'コメントの削除に失敗しました') {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
      }

      console.error('Delete comment error:', error)
      return NextResponse.json({ error: 'コメントの削除に失敗しました' }, { status: 500 })
    }
  }

  async getComment(
    request: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const userId = await this.getUserIdFromRequest(request)
      const commentId = context.params.id

      const input: GetCommentInputPort = {
        commentId,
        userId: userId || undefined,
      }

      const result = await this.commentRetrievalUseCase.getComment(input)

      return NextResponse.json({
        success: true,
        comment: result.comment,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'コメントが見つかりませんでした') {
          return NextResponse.json({ error: error.message }, { status: 404 })
        }
        if (error.message === 'このコメントは削除されています') {
          return NextResponse.json({ error: error.message }, { status: 404 })
        }
      }

      console.error('Get comment error:', error)
      return NextResponse.json({ error: 'コメントの取得に失敗しました' }, { status: 500 })
    }
  }

  async getComments(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getUserIdFromRequest(request)
      const url = new URL(request.url)
      const postId = url.searchParams.get('id')

      if (!postId) {
        return NextResponse.json({ error: '投稿IDが指定されていません' }, { status: 400 })
      }

      const input: GetCommentsInputPort = {
        postId,
        userId: userId || undefined,
      }

      const result = await this.commentRetrievalUseCase.getComments(input)

      return NextResponse.json({
        success: true,
        comments: result.comments,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === '投稿が見つかりませんでした') {
          return NextResponse.json({ error: error.message }, { status: 404 })
        }
        if (error.message === 'この投稿のコメントは表示できません') {
          return NextResponse.json({ error: error.message }, { status: 403 })
        }
      }

      console.error('Get comments error:', error)
      return NextResponse.json({ error: 'コメントの取得に失敗しました' }, { status: 500 })
    }
  }

  async getCommentsWithPagination(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getUserIdFromRequest(request)
      const url = new URL(request.url)
      const postId = url.searchParams.get('id')
      const page = parseInt(url.searchParams.get('page') || '1', 10)
      const limit = parseInt(url.searchParams.get('limit') || '10', 10)

      if (!postId) {
        return NextResponse.json({ error: '投稿IDが指定されていません' }, { status: 400 })
      }

      const input: GetCommentsWithPaginationInputPort = {
        postId,
        page,
        limit,
        userId: userId || undefined,
      }

      const result = await this.commentRetrievalUseCase.getCommentsWithPagination(input)

      // Presenterを使用してレスポンスを整形
      const formattedComments = result.comments.map((comment: any) => {
        const formattedReplies = comment.replies?.map((reply: any) => ({
          comment: reply,
          user: comment.user,
        }))
        return CommentPresenter.toResponse(
          comment,
          comment.user,
          userId || undefined,
          formattedReplies
        )
      })

      return NextResponse.json({
        comments: formattedComments,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          hasNext: result.hasNext,
        },
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === '投稿が見つかりませんでした') {
          return NextResponse.json({ error: error.message }, { status: 404 })
        }
        if (error.message === 'この投稿のコメントは表示できません') {
          return NextResponse.json({ error: error.message }, { status: 403 })
        }
      }

      console.error('Get comments with pagination error:', error)
      return NextResponse.json({ error: 'コメントの取得に失敗しました' }, { status: 500 })
    }
  }

  async getCommentsForPost(
    request: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const userId = await this.getUserIdFromRequest(request)
      const postId = context.params.id
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1', 10)
      const limit = parseInt(url.searchParams.get('limit') || '10', 10)

      const input: GetCommentsWithPaginationInputPort = {
        postId,
        page,
        limit,
        userId: userId || undefined,
      }

      const result = await this.commentRetrievalUseCase.getCommentsWithPagination(input)

      // Presenterを使用してレスポンスを整形
      const formattedComments = result.comments.map((comment: any) => {
        const formattedReplies = comment.replies?.map((reply: any) => ({
          comment: reply,
          user: comment.user,
        }))
        return CommentPresenter.toResponse(
          comment,
          comment.user,
          userId || undefined,
          formattedReplies
        )
      })

      return NextResponse.json({
        comments: formattedComments,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          hasNext: result.hasNext,
        },
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === '投稿が見つかりませんでした') {
          return NextResponse.json({ error: error.message }, { status: 404 })
        }
        if (error.message === 'この投稿のコメントは表示できません') {
          return NextResponse.json({ error: error.message }, { status: 403 })
        }
      }

      console.error('Get comments for post error:', error)
      return NextResponse.json({ error: 'コメントの取得に失敗しました' }, { status: 500 })
    }
  }

  async createCommentForPost(
    request: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const userId = await this.getUserIdFromRequest(request)
      if (!userId) {
        return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
      }

      const postId = context.params.id
      const body = await request.json()
      const { content } = body

      const input: CreateCommentInputPort = {
        postId,
        userId,
        content,
      }

      const result = await this.commentManagementUseCase.createComment(input)

      return NextResponse.json(
        {
          success: true,
          comment: result.comment,
          message: 'コメントを投稿しました',
        },
        { status: 201 }
      )
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'コメント内容は必須です' ||
          error.message === 'コメントは1000文字以内で入力してください'
        ) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        if (error.message === '投稿が見つかりませんでした') {
          return NextResponse.json({ error: error.message }, { status: 404 })
        }
        if (error.message === 'この投稿にはコメントできません') {
          return NextResponse.json({ error: error.message }, { status: 403 })
        }
        if (error.message === 'ユーザーが見つかりませんでした') {
          return NextResponse.json({ error: 'トークンが無効です' }, { status: 401 })
        }
        if (error.message === '投稿間隔を空けてください（5秒に1回まで）') {
          return NextResponse.json({ error: error.message }, { status: 429 })
        }
      }

      console.error('Create comment for post error:', error)
      return NextResponse.json({ error: 'コメントの投稿に失敗しました' }, { status: 500 })
    }
  }
}
