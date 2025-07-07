import { NextRequest, NextResponse } from 'next/server'
import { CreateCommentUseCase } from '@api/usecases/comments/CreateCommentUseCase'
import { CreateReplyUseCase } from '@api/usecases/comments/CreateReplyUseCase'
import { UpdateCommentUseCase } from '@api/usecases/comments/UpdateCommentUseCase'
import { DeleteCommentUseCase } from '@api/usecases/comments/DeleteCommentUseCase'
import { GetCommentUseCase } from '@api/usecases/comments/GetCommentUseCase'
import { GetCommentsUseCase } from '@api/usecases/comments/GetCommentsUseCase'
import { CommentRepositoryImpl } from '@api/interface-adapters/repositories/CommentRepositoryImpl'
import { PostRepositoryImpl } from '@api/interface-adapters/repositories/PostRepositoryImpl'
import { UserRepositoryImpl } from '@api/interface-adapters/repositories/UserRepositoryImpl'
import { TokenServiceImpl } from '@api/interface-adapters/services/TokenServiceImpl'

export class CommentController {
  private commentRepository: CommentRepositoryImpl
  private postRepository: PostRepositoryImpl
  private userRepository: UserRepositoryImpl
  private tokenService: TokenServiceImpl

  constructor() {
    this.commentRepository = new CommentRepositoryImpl()
    this.postRepository = new PostRepositoryImpl()
    this.userRepository = new UserRepositoryImpl()
    this.tokenService = new TokenServiceImpl()
  }

  private async getUserIdFromRequest(request: NextRequest): Promise<string | null> {
    // First try Authorization header
    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      return await this.tokenService.verifyAuthToken(token)
    }

    // Then try cookie-based authentication (for legacy compatibility)
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim())
      const authCookie = cookies.find(c => c.startsWith('auth-token='))
      if (authCookie) {
        const token = authCookie.split('=')[1]
        return await this.tokenService.verifyAuthToken(token)
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

      const createCommentUseCase = new CreateCommentUseCase(
        this.commentRepository,
        this.postRepository,
        this.userRepository
      )

      const result = await createCommentUseCase.execute({
        postId,
        userId,
        content,
      })

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

      const createReplyUseCase = new CreateReplyUseCase(
        this.commentRepository,
        this.postRepository,
        this.userRepository
      )

      const result = await createReplyUseCase.execute({
        parentCommentId,
        userId,
        content,
      })

      return NextResponse.json({
        success: true,
        comment: result.reply,
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

      const updateCommentUseCase = new UpdateCommentUseCase(this.commentRepository)

      const result = await updateCommentUseCase.execute({
        commentId,
        userId,
        content,
      })

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

      const deleteCommentUseCase = new DeleteCommentUseCase(this.commentRepository)

      const result = await deleteCommentUseCase.execute({
        commentId,
        userId,
      })

      return NextResponse.json({
        success: result.success,
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

      const getCommentUseCase = new GetCommentUseCase(this.commentRepository)

      const result = await getCommentUseCase.execute({
        commentId,
        userId: userId || undefined,
      })

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

      const getCommentsUseCase = new GetCommentsUseCase(this.commentRepository, this.postRepository)

      const result = await getCommentsUseCase.execute({
        postId,
        userId: userId || undefined,
      })

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
}
