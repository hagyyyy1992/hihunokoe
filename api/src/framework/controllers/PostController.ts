import { NextRequest, NextResponse } from 'next/server'
import { PostRepository } from '@api/interface-adapters/repositories/Post.repository'
import { UserRepository } from '@api/interface-adapters/repositories/User.repository'
import { EmpathyRepository } from '@api/interface-adapters/repositories/Empathy.repository'
import { CommentRepository } from '@api/interface-adapters/repositories/Comment.repository'
import { TokenServiceImpl } from '@api/interface-adapters/services/TokenServiceImpl'
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
import { isDatabaseAvailable } from '@/lib/prisma'
import { MOCK_POSTS, MOCK_EMPATHIES } from '@/lib/mock-data'

export class PostController {
  private postManagementUseCase: PostManagementUseCase
  private postRetrievalUseCase: PostRetrievalUseCase
  private empathyManagementUseCase: EmpathyManagementUseCase
  private tokenService: TokenServiceImpl

  constructor() {
    const postRepository = new PostRepository()
    const userRepository = new UserRepository()
    const empathyRepository = new EmpathyRepository()
    const commentRepository = new CommentRepository()
    this.tokenService = new TokenServiceImpl()

    this.postManagementUseCase = new PostManagementUseCase(postRepository, userRepository)
    this.postRetrievalUseCase = new PostRetrievalUseCase(
      postRepository,
      empathyRepository,
      commentRepository
    )
    this.empathyManagementUseCase = new EmpathyManagementUseCase(
      postRepository,
      userRepository,
      empathyRepository
    )
  }

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

  async createPost(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getUserIdFromRequest(request)
      if (!userId) {
        return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
      }

      const body = await request.json()

      const {
        title,
        content,
        cosmeticName,
        cosmeticCategory,
        productName = cosmeticName,
        brandName,
        imageUrl,
        category = cosmeticCategory,
        skinType,
        moodTag,
        usageSituation,
        experienceDetails,
      } = body

      const input: CreatePostInputPort = {
        userId,
        title,
        content,
        productName,
        brandName,
        imageUrl,
        category,
        skinType,
        moodTag,
        usageSituation,
        experienceDetails,
      }

      const result = await this.postManagementUseCase.createPost(input)

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

      const input: GetPostInputPort = {
        postId,
        userId: userId || undefined,
      }

      const result = await this.postRetrievalUseCase.getPost(input)

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
      const skinType = url.searchParams.get('skinType') || undefined
      const moodTag = url.searchParams.get('moodTag') || undefined
      const search = url.searchParams.get('search') || undefined
      const sortByParam = url.searchParams.get('sortBy') || 'recent'
      const sortBy = sortByParam === 'popular' ? 'empathyCount' : 'createdAt'
      const userId = await this.getUserIdFromRequest(request)

      const input: GetPostsInputPort = {
        page,
        limit,
        category,
        skinType,
        moodTag,
        search,
        sortBy: sortBy as 'createdAt' | 'empathyCount',
        userId: userId || undefined,
      }

      const result = await this.postRetrievalUseCase.getPosts(input)

      return NextResponse.json({
        posts: result.posts,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: Math.ceil(result.total / result.limit),
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

      const input: UpdatePostInputPort = {
        postId,
        userId,
        title,
        content,
        productName,
        brandName,
        imageUrl,
        category,
      }

      const result = await this.postManagementUseCase.updatePost(input)

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

      const input: DeletePostInputPort = { postId, userId }

      await this.postManagementUseCase.deletePost(input)

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

      const body = await request.json()
      const { empathyType } = body

      const input: AddEmpathyInputPort = { postId, userId }

      const result = await this.empathyManagementUseCase.addEmpathy(input)

      return NextResponse.json({
        success: true,
        empathy: result.empathy,
        message: result.message,
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

      const input: RemoveEmpathyInputPort = { postId, userId }

      const result = await this.empathyManagementUseCase.removeEmpathy(input)

      return NextResponse.json({
        success: true,
        message: result.message,
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

  async getPostByQuery(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url)
      const postId = url.searchParams.get('id')

      if (!postId) {
        return NextResponse.json({ error: 'IDが指定されていません' }, { status: 400 })
      }

      const userId = await this.getUserIdFromRequest(request)
      const input: GetPostInputPort = {
        postId,
        userId: userId || undefined,
      }

      const result = await this.postRetrievalUseCase.getPost(input)

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

      const input: UpdatePostInputPort = {
        postId,
        userId,
        title,
        content,
        productName,
        brandName,
        imageUrl,
        category,
      }

      const result = await this.postManagementUseCase.updatePost(input)

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

      const input: DeletePostInputPort = { postId, userId }

      await this.postManagementUseCase.deletePost(input)

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

      if (!['helpful', 'interested', 'supportive'].includes(empathyType)) {
        return NextResponse.json({ error: '入力内容に誤りがあります' }, { status: 400 })
      }

      if (!isDatabaseAvailable()) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(postId)) {
          return NextResponse.json({ error: '無効なIDです' }, { status: 400 })
        }

        const post = MOCK_POSTS.find(p => p.id === postId)
        if (!post) {
          return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
        }

        const existingEmpathy = MOCK_EMPATHIES.find(e => e.postId === postId && e.userId === userId)
        if (existingEmpathy) {
          return NextResponse.json({ error: '既に共感済みです' }, { status: 400 })
        }

        const newEmpathy = {
          id: `empathy-${Date.now()}`,
          postId,
          userId,
          empathyType,
          createdAt: new Date(),
        }
        MOCK_EMPATHIES.push(newEmpathy)

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

      const input: AddEmpathyInputPort = { postId, userId }
      const result = await this.empathyManagementUseCase.addEmpathy(input)

      return NextResponse.json({
        success: true,
        empathy: {
          id: result.empathy.id,
          postId: result.empathy.postId,
          userId: result.empathy.userId,
          empathyType: result.empathy.empathyType,
          createdAt: result.empathy.createdAt,
        },
        totalCount: 1,
        message: result.message || '共感を追加しました',
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
      const input: RemoveEmpathyInputPort = { postId, userId }

      const result = await this.empathyManagementUseCase.removeEmpathy(input)

      return NextResponse.json({
        success: true,
        totalCount: 0,
        message: result.message || '共感を削除しました',
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

      const input: GetEmpathyStatusInputPort = { postId, userId }

      const result = await this.empathyManagementUseCase.getEmpathyStatus(input)

      return NextResponse.json({
        hasEmpathized: result.hasEmpathy,
        empathyType: null,
        totalCount: result.empathyCount,
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
      const input: GetEmpathyStatusInputPort = { postId, userId }

      const result = await this.empathyManagementUseCase.getEmpathyStatus(input)

      return NextResponse.json({
        hasEmpathized: result.hasEmpathy,
        empathyType: null,
        totalCount: result.empathyCount,
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
