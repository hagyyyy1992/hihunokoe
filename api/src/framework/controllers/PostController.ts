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
import { IAuthService } from '@api/domain/services/AuthService'
import { ICacheService } from '@api/domain/services/CacheService'
import { IFieldMappingService } from '@api/domain/services/FieldMappingService'
import { PostPresenter } from '@api/framework/presenters/PostPresenter'
import { PostValidator } from '@api/framework/validators/PostValidator'
import { ErrorHandler } from '@api/framework/errors/ErrorHandler'
import type { CachedPostsResponse } from '@/types/cache'

export class PostController {
  constructor(
    private postManagementUseCase: PostManagementUseCase,
    private postRetrievalUseCase: PostRetrievalUseCase,
    private empathyManagementUseCase: EmpathyManagementUseCase,
    private authService: IAuthService,
    private cacheService: ICacheService,
    private fieldMappingService: IFieldMappingService
  ) {}

  async createPost(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.authService.requireAuth(request)
      const body = await request.json()

      const mappedBody = this.fieldMappingService.mapLegacyPostFields(body)
      const validatedData = PostValidator.validateCreatePost({
        ...mappedBody,
        userId,
      })

      const input: CreatePostInputPort = validatedData
      const result = await this.postManagementUseCase.createPost(input)

      const postResponse = PostPresenter.toResponse(
        result.post,
        result.user,
        result.empathyCount,
        result.commentCount
      )

      // 投稿一覧のキャッシュをクリア
      this.cacheService.deletePattern('^posts:')

      return PostPresenter.presentCreated(postResponse)
    } catch (error) {
      return ErrorHandler.handle(error)
    }
  }

  async getPost(request: NextRequest, context: { params: { id: string } }): Promise<NextResponse> {
    try {
      const postId = PostValidator.validatePostId(context.params.id)
      const userId = await this.authService.getUserIdFromRequest(request)

      const input: GetPostInputPort = {
        postId,
        userId: userId || undefined,
      }

      const result = await this.postRetrievalUseCase.getPost(input)

      const postResponse = PostPresenter.toResponse(
        result.post,
        result.user,
        result.empathyCount,
        result.commentCount,
        result.userHasEmpathy
      )

      return PostPresenter.presentPost(postResponse)
    } catch (error) {
      return ErrorHandler.handle(error)
    }
  }

  async getPosts(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url)
      const userId = await this.authService.getUserIdFromRequest(request)

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

      // キャッシュキーの生成
      const cacheKey = `posts:${page}:${limit}:${category || ''}:${skinType || ''}:${moodTag || ''}:${search || ''}:${sortBy}`

      // キャッシュから取得を試みる
      const cachedResult = this.cacheService.get<CachedPostsResponse>(cacheKey)
      if (cachedResult) {
        // ユーザー固有のデータを初値で追加
        const postsWithUserData = cachedResult.posts.map((post: any) => ({
          ...post,
          userHasEmpathy: false,
        }))
        return PostPresenter.presentPostList(postsWithUserData, cachedResult.pagination)
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

      // レスポンスを作成
      const postsResponse = result.posts.map(post => PostPresenter.toResponseWithMetadata(post))

      const pagination = {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit),
      }

      // ユーザー固有のデータを除外してキャッシュ
      const cacheData: CachedPostsResponse = {
        posts: postsResponse.map((post: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { userHasEmpathy, ...postWithoutUserData } = post
          return postWithoutUserData
        }),
        pagination,
      }

      // 30秒間キャッシュ
      this.cacheService.set(cacheKey, cacheData, 30 * 1000)

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
      const userId = await this.authService.requireAuth(request)
      const body = await request.json()

      const mappedBody = this.fieldMappingService.mapLegacyPostFields(body)
      const validatedData = PostValidator.validateUpdatePost({
        ...mappedBody,
        postId,
        userId,
      })

      const input: UpdatePostInputPort = validatedData
      const result = await this.postManagementUseCase.updatePost(input)

      const postResponse = PostPresenter.toResponse(
        result.post,
        result.user,
        result.empathyCount,
        result.commentCount,
        result.userHasEmpathy
      )

      // 投稿一覧のキャッシュをクリア
      this.cacheService.deletePattern('^posts:')

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
      const userId = await this.authService.requireAuth(request)

      const input: DeletePostInputPort = { postId, userId }
      await this.postManagementUseCase.deletePost(input)

      // 投稿一覧のキャッシュをクリア
      this.cacheService.deletePattern('^posts:')

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
      const userId = await this.authService.requireAuth(request)

      const input: AddEmpathyInputPort = { postId, userId }
      const result = await this.empathyManagementUseCase.addEmpathy(input)

      const empathyResponse = PostPresenter.toEmpathyResponse(result.empathy)
      return PostPresenter.presentEmpathyAdded(empathyResponse, result.totalCount)
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
      const userId = await this.authService.requireAuth(request)

      const input: RemoveEmpathyInputPort = { postId, userId }
      const result = await this.empathyManagementUseCase.removeEmpathy(input)

      return PostPresenter.presentEmpathyRemoved(result.totalCount)
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
      const userId = await this.authService.requireAuth(request)

      const input: GetEmpathyStatusInputPort = { postId, userId }
      const result = await this.empathyManagementUseCase.getEmpathyStatus(input)

      return PostPresenter.presentEmpathyStatus(result.hasEmpathy, null, result.empathyCount)
    } catch (error) {
      return ErrorHandler.handle(error)
    }
  }
}
