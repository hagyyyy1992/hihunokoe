import { NextRequest, NextResponse } from 'next/server'
import {
  PostManagementUseCase,
  PostRetrievalUseCase,
  EmpathyManagementUseCase,
} from '@api/usecases/posts/interactor'
import type {
  CreatePostInputPort,
  UpdatePostInputPort,
  DeletePostInputPort,
  GetPostInputPort,
  GetPostsInputPort,
  AddEmpathyInputPort,
  RemoveEmpathyInputPort,
  GetEmpathyStatusInputPort,
} from '@api/usecases/posts/input-port'
import type { TokenService } from '@api/domain/services/TokenService'
import type { IUserRepository } from '@api/domain/repositories/UserRepository'
import type { IPostRepository } from '@api/domain/repositories/PostRepository'
import type { IEmpathyRepository } from '@api/domain/repositories/EmpathyRepository'
import type { ICommentRepository } from '@api/domain/repositories/CommentRepository'
import { PostPresenter } from '@api/framework/presenters/PostPresenter'
import { PostValidator } from '@api/framework/validators/PostValidator'
import { ErrorHandler } from '@api/framework/errors/ErrorHandler'
import { ApplicationError } from '@api/framework/errors/ApplicationError'
import { memoryCache } from '@/lib/cache/memory-cache'
import type { CachedPostsResponse, CachedPost } from '@/types/cache'

export class PostController {
  constructor(
    private postManagementUseCase: PostManagementUseCase,
    private postRetrievalUseCase: PostRetrievalUseCase,
    private empathyManagementUseCase: EmpathyManagementUseCase,
    private tokenService: TokenService,
    private userRepository: IUserRepository,
    private empathyRepository: IEmpathyRepository,
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

  async createPost(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.requireAuth(request)
      const body = await request.json()

      // レガシーAPIとの互換性のため、旧フィールド名を新フィールド名にマッピング
      const mappedBody = {
        ...body,
        productName: body.productName || body.cosmeticName,
        category: body.category || body.cosmeticCategory,
      }

      const validatedData = PostValidator.validateCreatePost({
        ...mappedBody,
        userId,
      })

      const input: CreatePostInputPort = validatedData

      const result = await this.postManagementUseCase.createPost(input)

      // ユーザー情報を取得
      const user = await this.userRepository.findById(result.post.userId)
      if (!user) {
        throw ApplicationError.notFound('ユーザー')
      }

      // 投稿のレスポンス用データを作成
      const empathyCount = await this.empathyRepository.countByPost(result.post.id)
      const commentCount = await this.commentRepository.countByPostId(result.post.id)

      const postResponse = PostPresenter.toResponse(result.post, user, empathyCount, commentCount)

      // 投稿一覧のキャッシュをクリア
      memoryCache.deletePattern('^posts:')

      return PostPresenter.presentCreated(postResponse)
    } catch (error) {
      return ErrorHandler.handle(error)
    }
  }

  async getPost(request: NextRequest, context: { params: { id: string } }): Promise<NextResponse> {
    try {
      const postId = PostValidator.validatePostId(context.params.id)
      const userId = await this.getUserIdFromRequest(request)

      const input: GetPostInputPort = {
        postId,
        userId: userId || undefined,
      }

      const result = await this.postRetrievalUseCase.getPost(input)

      // ユーザー情報を取得
      const user = await this.userRepository.findById(result.post.userId)
      if (!user) {
        throw ApplicationError.notFound('ユーザー')
      }

      // 投稿のレスポンス用データを作成
      const empathyCount = await this.empathyRepository.countByPost(result.post.id)
      const commentCount = await this.commentRepository.countByPostId(result.post.id)
      const userHasEmpathy = userId
        ? (await this.empathyRepository.findByUserAndPost(userId, result.post.id)) !== null
        : false

      const postResponse = PostPresenter.toResponse(
        result.post,
        user,
        empathyCount,
        commentCount,
        userHasEmpathy
      )

      return PostPresenter.presentPost(postResponse)
    } catch (error) {
      return ErrorHandler.handle(error)
    }
  }

  async getPosts(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url)
      const userId = await this.getUserIdFromRequest(request)

      // バリデーション
      const { page, limit } = PostValidator.validatePagination(
        url.searchParams.get('page'),
        url.searchParams.get('limit')
      )
      const category = PostValidator.validateCategory(url.searchParams.get('category'))
      const skinType = PostValidator.validateSkinType(url.searchParams.get('skinType'))
      const moodTag = PostValidator.validateMoodTag(url.searchParams.get('moodTag'))
      const search = PostValidator.validateSearch(url.searchParams.get('search'))
      const sortBy = PostValidator.validateSortBy(url.searchParams.get('sortBy'))

      // キャッシュキーの生成（ユーザー固有のデータを含まない）
      const cacheKey = `posts:${page}:${limit}:${category || ''}:${skinType || ''}:${moodTag || ''}:${search || ''}:${sortBy}`

      // キャッシュから取得を試みる
      const cachedResult = memoryCache.get<CachedPostsResponse>(cacheKey)
      if (cachedResult) {
        // ユーザー固有のデータ（userHasEmpathy）を追加
        if (userId) {
          const userEmpathies = await this.empathyRepository.findByUserAndPosts(
            userId,
            cachedResult.posts.map(p => p.id)
          )
          const empathyMap = new Map(userEmpathies.map(e => [e.postId, true]))

          cachedResult.posts = cachedResult.posts.map(post => ({
            ...post,
            userHasEmpathy: empathyMap.get(post.id) || false,
          }))
        }

        return PostPresenter.presentPostList(cachedResult.posts as any[], cachedResult.pagination)
      }

      const input: GetPostsInputPort = {
        page,
        limit,
        category,
        skinType,
        moodTag,
        search,
        sortBy,
        userId: userId || undefined,
      }

      const result = await this.postRetrievalUseCase.getPosts(input)

      // 各投稿のレスポンスを作成
      const postsResponse = await Promise.all(
        result.posts.map(async post => {
          const user = await this.userRepository.findById(post.userId)
          if (!user) throw ApplicationError.notFound('ユーザー')

          const empathyCount = await this.empathyRepository.countByPost(post.id)
          const commentCount = await this.commentRepository.countByPostId(post.id)
          const userHasEmpathy = userId
            ? (await this.empathyRepository.findByUserAndPost(userId, post.id)) !== null
            : false

          return PostPresenter.toResponse(post, user, empathyCount, commentCount, userHasEmpathy)
        })
      )

      const pagination = {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit),
      }

      // ユーザー固有のデータを除外してキャッシュ
      const cacheData: CachedPostsResponse = {
        posts: postsResponse.map(post => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { userHasEmpathy, ...postWithoutUserData } = post
          return postWithoutUserData as any
        }),
        pagination,
      }

      // 30秒間キャッシュ
      memoryCache.set(cacheKey, cacheData, 30 * 1000)

      return PostPresenter.presentPostList(postsResponse, pagination)
    } catch (error) {
      return ErrorHandler.handle(error)
    }
  }

  async updatePost(
    request: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const postId = PostValidator.validatePostId(context.params.id)
      const userId = await this.requireAuth(request)
      const body = await request.json()

      // レガシーAPIとの互換性のため、旧フィールド名を新フィールド名にマッピング
      const mappedBody = {
        ...body,
        productName: body.productName || body.cosmeticName,
        category: body.category || body.cosmeticCategory,
      }

      const validatedData = PostValidator.validateUpdatePost({
        ...mappedBody,
        postId,
        userId,
      })

      const input: UpdatePostInputPort = validatedData

      const result = await this.postManagementUseCase.updatePost(input)

      // ユーザー情報を取得
      const user = await this.userRepository.findById(result.post.userId)
      if (!user) {
        throw ApplicationError.notFound('ユーザー')
      }

      // 投稿のレスポンス用データを作成
      const empathyCount = await this.empathyRepository.countByPost(result.post.id)
      const commentCount = await this.commentRepository.countByPostId(result.post.id)
      const userHasEmpathy =
        (await this.empathyRepository.findByUserAndPost(userId, result.post.id)) !== null

      const postResponse = PostPresenter.toResponse(
        result.post,
        user,
        empathyCount,
        commentCount,
        userHasEmpathy
      )

      // 投稿一覧のキャッシュをクリア
      memoryCache.deletePattern('^posts:')

      return PostPresenter.presentUpdated(postResponse)
    } catch (error) {
      return ErrorHandler.handle(error)
    }
  }

  async deletePost(
    request: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const postId = PostValidator.validatePostId(context.params.id)
      const userId = await this.requireAuth(request)

      const input: DeletePostInputPort = { postId, userId }

      await this.postManagementUseCase.deletePost(input)

      // 投稿一覧のキャッシュをクリア
      memoryCache.deletePattern('^posts:')

      return PostPresenter.presentDeleted()
    } catch (error) {
      return ErrorHandler.handle(error)
    }
  }

  async addEmpathy(
    request: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const postId = PostValidator.validatePostId(context.params.id)
      const userId = await this.requireAuth(request)

      const input: AddEmpathyInputPort = { postId, userId }

      const result = await this.empathyManagementUseCase.addEmpathy(input)

      const empathyResponse = PostPresenter.toEmpathyResponse(result.empathy)
      const totalCount = await this.empathyRepository.countByPost(postId)

      return PostPresenter.presentEmpathyAdded(empathyResponse, totalCount)
    } catch (error) {
      return ErrorHandler.handle(error)
    }
  }

  async removeEmpathy(
    request: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const postId = PostValidator.validatePostId(context.params.id)
      const userId = await this.requireAuth(request)

      const input: RemoveEmpathyInputPort = { postId, userId }

      await this.empathyManagementUseCase.removeEmpathy(input)

      const totalCount = await this.empathyRepository.countByPost(postId)

      return PostPresenter.presentEmpathyRemoved(totalCount)
    } catch (error) {
      return ErrorHandler.handle(error)
    }
  }

  async getEmpathyStatus(
    request: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const postId = PostValidator.validatePostId(context.params.id)
      const userId = await this.requireAuth(request)

      const input: GetEmpathyStatusInputPort = { postId, userId }

      const result = await this.empathyManagementUseCase.getEmpathyStatus(input)

      return PostPresenter.presentEmpathyStatus(result.hasEmpathy, null, result.empathyCount)
    } catch (error) {
      return ErrorHandler.handle(error)
    }
  }
}
