import { NextRequest, NextResponse } from 'next/server'
import { CreatePostUseCase } from '@api/usecases/posts/CreatePostUseCase'
import { GetPostUseCase } from '@api/usecases/posts/GetPostUseCase'
import { GetPostsUseCase } from '@api/usecases/posts/GetPostsUseCase'
import { UpdatePostUseCase } from '@api/usecases/posts/UpdatePostUseCase'
import { DeletePostUseCase } from '@api/usecases/posts/DeletePostUseCase'
import { AddEmpathyUseCase } from '@api/usecases/posts/AddEmpathyUseCase'
import { RemoveEmpathyUseCase } from '@api/usecases/posts/RemoveEmpathyUseCase'
import { GetEmpathyStatusUseCase } from '@api/usecases/posts/GetEmpathyStatusUseCase'
import { PostRepositoryImpl } from '@api/interface-adapters/repositories/PostRepositoryImpl'
import { UserRepositoryImpl } from '@api/interface-adapters/repositories/UserRepositoryImpl'
import { EmpathyRepositoryImpl } from '@api/interface-adapters/repositories/EmpathyRepositoryImpl'
import { TokenServiceImpl } from '@api/interface-adapters/services/TokenServiceImpl'
import { isDatabaseAvailable } from '@/lib/prisma'
import { MOCK_POSTS, MOCK_EMPATHIES } from '@/lib/mock-data'

export class PostController {
  private postRepository: PostRepositoryImpl
  private userRepository: UserRepositoryImpl
  private empathyRepository: EmpathyRepositoryImpl
  private tokenService: TokenServiceImpl

  constructor() {
    this.postRepository = new PostRepositoryImpl()
    this.userRepository = new UserRepositoryImpl()
    this.empathyRepository = new EmpathyRepositoryImpl()
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

  async createPost(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getUserIdFromRequest(request)
      if (!userId) {
        return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
      }

      const body = await request.json()

      // Map legacy field names to clean architecture field names
      const {
        title,
        content,
        cosmeticName,
        cosmeticCategory,
        productName = cosmeticName,
        brandName,
        imageUrl,
        category = cosmeticCategory,
      } = body

      const createPostUseCase = new CreatePostUseCase(this.postRepository, this.userRepository)

      const result = await createPostUseCase.execute({
        userId,
        title,
        content,
        productName,
        brandName,
        imageUrl,
        category,
      })

      return NextResponse.json({
        post: result.post,
        message: '投稿が作成されました',
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found' || error.message === 'User account is inactive') {
          return NextResponse.json({ error: 'トークンが無効です' }, { status: 401 })
        }
        if (error.message.includes('required') || error.message.includes('characters')) {
          return NextResponse.json({ error: '入力内容に誤りがあります' }, { status: 400 })
        }
      }

      console.error('Create post error:', error)
      return NextResponse.json({ error: '投稿の作成に失敗しました' }, { status: 500 })
    }
  }

  async getPost(request: NextRequest, context: { params: { id: string } }): Promise<NextResponse> {
    try {
      const postId = context.params.id
      const userId = await this.getUserIdFromRequest(request)

      const getPostUseCase = new GetPostUseCase(this.postRepository)

      const result = await getPostUseCase.execute({
        postId,
        requestUserId: userId || undefined,
      })

      return NextResponse.json({
        post: result.post,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Post not found') {
          return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
        }
      }

      console.error('Get post error:', error)
      return NextResponse.json({ error: '投稿の取得に失敗しました' }, { status: 500 })
    }
  }

  async getPosts(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '10')
      const category = url.searchParams.get('category') || undefined
      const search = url.searchParams.get('search') || undefined
      const sortBy = (url.searchParams.get('sortBy') as 'recent' | 'popular') || 'recent'
      const userId = await this.getUserIdFromRequest(request)

      const getPostsUseCase = new GetPostsUseCase(this.postRepository)

      const result = await getPostsUseCase.execute({
        page,
        limit,
        category,
        search,
        sortBy,
        userId: userId || undefined,
      })

      return NextResponse.json({
        posts: result.posts,
        pagination: {
          page: result.currentPage,
          limit,
          total: result.totalCount,
          pages: result.totalPages,
        },
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Page') || error.message.includes('Limit')) {
          return NextResponse.json({ error: '入力内容に誤りがあります' }, { status: 400 })
        }
      }

      console.error('Get posts error:', error)
      return NextResponse.json({ error: '投稿の取得に失敗しました' }, { status: 500 })
    }
  }

  async updatePost(
    request: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const postId = context.params.id
      const userId = await this.getUserIdFromRequest(request)

      if (!userId) {
        return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
      }

      const body = await request.json()

      // Map legacy field names to clean architecture field names
      const {
        title,
        content,
        cosmeticName,
        cosmeticCategory,
        productName = cosmeticName,
        brandName,
        imageUrl,
        category = cosmeticCategory,
      } = body

      const updatePostUseCase = new UpdatePostUseCase(this.postRepository)

      const result = await updatePostUseCase.execute({
        postId,
        userId,
        title,
        content,
        productName,
        brandName,
        imageUrl,
        category,
      })

      return NextResponse.json({
        post: result.post,
        message: '投稿が更新されました',
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Post not found') {
          return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
        }
        if (error.message === 'Not authorized to update this post') {
          return NextResponse.json({ error: '投稿の編集権限がありません' }, { status: 403 })
        }
        if (error.message.includes('required') || error.message.includes('characters')) {
          return NextResponse.json({ error: '入力内容に誤りがあります' }, { status: 400 })
        }
      }

      console.error('Update post error:', error)
      return NextResponse.json({ error: '投稿の更新に失敗しました' }, { status: 500 })
    }
  }

  async deletePost(
    request: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const postId = context.params.id
      const userId = await this.getUserIdFromRequest(request)

      if (!userId) {
        return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
      }

      const deletePostUseCase = new DeletePostUseCase(this.postRepository)

      await deletePostUseCase.execute({ postId, userId })

      return NextResponse.json({
        message: '投稿が削除されました',
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Post not found') {
          return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
        }
        if (error.message === 'Not authorized to delete this post') {
          return NextResponse.json({ error: '投稿の削除権限がありません' }, { status: 403 })
        }
      }

      console.error('Delete post error:', error)
      return NextResponse.json({ error: '投稿の削除に失敗しました' }, { status: 500 })
    }
  }

  async addEmpathy(
    request: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const postId = context.params.id
      const userId = await this.getUserIdFromRequest(request)

      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const addEmpathyUseCase = new AddEmpathyUseCase(
        this.empathyRepository,
        this.postRepository,
        this.userRepository
      )

      const body = await request.json()
      const { empathyType } = body

      const result = await addEmpathyUseCase.execute({ postId, userId, empathyType })

      return NextResponse.json({
        success: result.success,
        empathyCount: result.empathyCount,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found' || error.message === 'User account is inactive') {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (error.message === 'Post not found') {
          return NextResponse.json({ error: 'Post not found' }, { status: 404 })
        }
        if (error.message === 'Already gave empathy to this post') {
          return NextResponse.json({ error: 'Already gave empathy to this post' }, { status: 409 })
        }
      }

      console.error('Add empathy error:', error)
      return NextResponse.json({ error: 'An error occurred while adding empathy' }, { status: 500 })
    }
  }

  async removeEmpathy(
    request: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const postId = context.params.id
      const userId = await this.getUserIdFromRequest(request)

      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const removeEmpathyUseCase = new RemoveEmpathyUseCase(
        this.empathyRepository,
        this.postRepository
      )

      const result = await removeEmpathyUseCase.execute({ postId, userId })

      return NextResponse.json({
        success: result.success,
        empathyCount: result.empathyCount,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Post not found') {
          return NextResponse.json({ error: 'Post not found' }, { status: 404 })
        }
        if (error.message === 'No empathy found for this post') {
          return NextResponse.json({ error: 'No empathy found for this post' }, { status: 404 })
        }
      }

      console.error('Remove empathy error:', error)
      return NextResponse.json(
        { error: 'An error occurred while removing empathy' },
        { status: 500 }
      )
    }
  }

  // Query parameter-based endpoints for legacy compatibility
  async getPostByQuery(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url)
      const postId = url.searchParams.get('id')

      if (!postId) {
        return NextResponse.json({ error: 'IDが指定されていません' }, { status: 400 })
      }

      const userId = await this.getUserIdFromRequest(request)
      const getPostUseCase = new GetPostUseCase(this.postRepository)

      const result = await getPostUseCase.execute({
        postId,
        requestUserId: userId || undefined,
      })

      return NextResponse.json({
        success: true,
        post: result.post,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Post not found') {
          return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
        }
      }

      console.error('Get post error:', error)
      return NextResponse.json({ error: '投稿の取得に失敗しました' }, { status: 500 })
    }
  }

  async updatePostByQuery(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url)
      const postId = url.searchParams.get('id')

      if (!postId) {
        return NextResponse.json({ error: 'IDが指定されていません' }, { status: 400 })
      }

      const userId = await this.getUserIdFromRequest(request)
      if (!userId) {
        return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
      }

      const body = await request.json()

      // Map legacy field names to clean architecture field names
      const {
        title,
        content,
        cosmeticName,
        cosmeticCategory,
        productName = cosmeticName,
        brandName,
        imageUrl,
        category = cosmeticCategory,
      } = body

      const updatePostUseCase = new UpdatePostUseCase(this.postRepository)

      const result = await updatePostUseCase.execute({
        postId,
        userId,
        title,
        content,
        productName,
        brandName,
        imageUrl,
        category,
      })

      return NextResponse.json({
        post: result.post,
        message: '投稿が更新されました',
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Post not found') {
          return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
        }
        if (error.message === 'Not authorized to update this post') {
          return NextResponse.json({ error: '投稿の編集権限がありません' }, { status: 403 })
        }
        if (error.message.includes('required') || error.message.includes('characters')) {
          return NextResponse.json({ error: '入力内容に誤りがあります' }, { status: 400 })
        }
      }

      console.error('Update post error:', error)
      return NextResponse.json({ error: '投稿の更新に失敗しました' }, { status: 500 })
    }
  }

  async deletePostByQuery(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url)
      const postId = url.searchParams.get('id')

      if (!postId) {
        return NextResponse.json({ error: 'IDが指定されていません' }, { status: 400 })
      }

      const userId = await this.getUserIdFromRequest(request)
      if (!userId) {
        return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
      }

      const deletePostUseCase = new DeletePostUseCase(this.postRepository)

      await deletePostUseCase.execute({ postId, userId })

      return NextResponse.json({
        success: true,
        message: '投稿が削除されました',
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Post not found') {
          return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
        }
        if (error.message === 'Not authorized to delete this post') {
          return NextResponse.json({ error: '投稿の削除権限がありません' }, { status: 403 })
        }
      }

      console.error('Delete post error:', error)
      return NextResponse.json({ error: '投稿の削除に失敗しました' }, { status: 500 })
    }
  }

  async addEmpathyByQuery(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url)
      const postId = url.searchParams.get('id')

      if (!postId) {
        return NextResponse.json({ error: 'IDが指定されていません' }, { status: 400 })
      }

      const userId = await this.getUserIdFromRequest(request)
      if (!userId) {
        return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
      }

      const body = await request.json()
      const { empathyType } = body

      if (!empathyType) {
        return NextResponse.json({ error: 'empathyTypeが指定されていません' }, { status: 400 })
      }

      // Validate empathyType
      if (!['helpful', 'interested', 'supportive'].includes(empathyType)) {
        return NextResponse.json({ error: '入力内容に誤りがあります' }, { status: 400 })
      }

      if (!isDatabaseAvailable()) {
        // Mock mode
        // Validate postId format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(postId)) {
          return NextResponse.json({ error: '無効なIDです' }, { status: 400 })
        }

        // Check if post exists in mock data
        const post = MOCK_POSTS.find(p => p.id === postId)
        if (!post) {
          return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
        }

        // Check if user already gave empathy
        const existingEmpathy = MOCK_EMPATHIES.find(e => e.postId === postId && e.userId === userId)
        if (existingEmpathy) {
          return NextResponse.json({ error: '既に共感済みです' }, { status: 400 })
        }

        // Add empathy to mock data
        const newEmpathy = {
          id: `empathy-${Date.now()}`,
          postId,
          userId,
          empathyType,
          createdAt: new Date(),
        }
        MOCK_EMPATHIES.push(newEmpathy)

        // Get updated count
        const totalCount = MOCK_EMPATHIES.filter(e => e.postId === postId).length

        return NextResponse.json({
          success: true,
          empathy: {
            id: newEmpathy.id,
            postId: newEmpathy.postId,
            userId: newEmpathy.userId,
            empathyType: newEmpathy.empathyType,
            createdAt: newEmpathy.createdAt,
          },
          totalCount,
          message: '共感を追加しました（デモモード）',
        })
      }

      // Database mode
      const addEmpathyUseCase = new AddEmpathyUseCase(
        this.empathyRepository,
        this.postRepository,
        this.userRepository
      )

      const result = await addEmpathyUseCase.execute({ postId, userId, empathyType })

      return NextResponse.json({
        success: result.success,
        empathy: {
          id: result.empathy.id,
          postId: result.empathy.postId,
          userId: result.empathy.userId,
          empathyType: result.empathy.empathyType,
          createdAt: result.empathy.createdAt,
        },
        totalCount: result.empathyCount,
        message: '共感を追加しました',
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found' || error.message === 'User account is inactive') {
          return NextResponse.json({ error: 'トークンが無効です' }, { status: 401 })
        }
        if (error.message === 'Post not found') {
          return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
        }
        if (error.message === 'Already gave empathy to this post') {
          return NextResponse.json({ error: '既に共感済みです' }, { status: 400 })
        }
      }

      console.error('Add empathy error:', error)
      return NextResponse.json({ error: '共感の追加に失敗しました' }, { status: 500 })
    }
  }

  async removeEmpathyByQuery(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url)
      const postId = url.searchParams.get('id')

      if (!postId) {
        return NextResponse.json({ error: 'IDが指定されていません' }, { status: 400 })
      }

      const userId = await this.getUserIdFromRequest(request)
      if (!userId) {
        return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
      }

      if (!isDatabaseAvailable()) {
        // Mock mode
        // Validate postId format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(postId)) {
          return NextResponse.json({ error: '無効なIDです' }, { status: 400 })
        }

        // Check if post exists in mock data
        const post = MOCK_POSTS.find(p => p.id === postId)
        if (!post) {
          return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
        }

        // Find existing empathy
        const empathyIndex = MOCK_EMPATHIES.findIndex(
          e => e.postId === postId && e.userId === userId
        )
        if (empathyIndex === -1) {
          return NextResponse.json({ error: '共感が見つかりません' }, { status: 404 })
        }

        // Remove empathy from mock data
        MOCK_EMPATHIES.splice(empathyIndex, 1)

        // Get updated count
        const totalCount = MOCK_EMPATHIES.filter(e => e.postId === postId).length

        return NextResponse.json({
          success: true,
          totalCount,
          message: '共感を削除しました（デモモード）',
        })
      }

      // Database mode
      const removeEmpathyUseCase = new RemoveEmpathyUseCase(
        this.empathyRepository,
        this.postRepository
      )

      const result = await removeEmpathyUseCase.execute({ postId, userId })

      return NextResponse.json({
        success: result.success,
        empathyCount: result.empathyCount,
        message: '共感を削除しました',
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Post not found') {
          return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
        }
        if (error.message === 'No empathy found for this post') {
          return NextResponse.json({ error: '共感が見つかりません' }, { status: 404 })
        }
      }

      console.error('Remove empathy error:', error)
      return NextResponse.json({ error: '共感の削除に失敗しました' }, { status: 500 })
    }
  }

  async getEmpathyStatus(
    request: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const postId = context.params.id
      const userId = await this.getUserIdFromRequest(request)

      if (!userId) {
        return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
      }

      // For now, return mock status - this should be implemented with a proper use case
      return NextResponse.json({
        hasEmpathized: false,
        empathyType: null,
        totalCount: 0,
      })
    } catch (error) {
      console.error('Get empathy status error:', error)
      return NextResponse.json({ error: '共感状態の取得に失敗しました' }, { status: 500 })
    }
  }

  async getEmpathyStatusByQuery(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url)
      const postId = url.searchParams.get('id')

      if (!postId) {
        return NextResponse.json({ error: 'IDが指定されていません' }, { status: 400 })
      }

      const userId = await this.getUserIdFromRequest(request)
      if (!userId) {
        return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
      }

      if (!isDatabaseAvailable()) {
        // Mock mode
        // Validate postId format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(postId)) {
          return NextResponse.json({ error: '無効なIDです' }, { status: 400 })
        }

        // Check if post exists in mock data
        const post = MOCK_POSTS.find(p => p.id === postId)
        if (!post) {
          return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
        }

        // Check user's empathy status
        const userEmpathy = MOCK_EMPATHIES.find(e => e.postId === postId && e.userId === userId)
        const totalCount = MOCK_EMPATHIES.filter(e => e.postId === postId).length

        return NextResponse.json({
          hasEmpathized: !!userEmpathy,
          empathyType: userEmpathy?.empathyType || null,
          totalCount,
        })
      }

      // Database mode
      const getEmpathyStatusUseCase = new GetEmpathyStatusUseCase(
        this.empathyRepository,
        this.postRepository,
        this.userRepository
      )

      const result = await getEmpathyStatusUseCase.execute({ postId, userId })

      return NextResponse.json({
        hasEmpathized: result.hasEmpathized,
        empathyType: result.empathyType,
        totalCount: result.totalCount,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found' || error.message === 'User account is inactive') {
          return NextResponse.json({ error: 'トークンが無効です' }, { status: 401 })
        }
        if (error.message === 'Post not found') {
          return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
        }
      }

      console.error('Get empathy status error:', error)
      return NextResponse.json({ error: '共感状態の取得に失敗しました' }, { status: 500 })
    }
  }
}
