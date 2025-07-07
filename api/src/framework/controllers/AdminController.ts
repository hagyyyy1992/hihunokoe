import { NextRequest, NextResponse } from 'next/server'
import { AdminLoginUseCase } from '@api/usecases/admin/AdminLoginUseCase'
import { GetDashboardStatsUseCase } from '@api/usecases/admin/GetDashboardStatsUseCase'
import { GetAdminUsersUseCase } from '@api/usecases/admin/GetAdminUsersUseCase'
import { UserRepositoryImpl } from '@api/interface-adapters/repositories/UserRepositoryImpl'
import { PostRepositoryImpl } from '@api/interface-adapters/repositories/PostRepositoryImpl'
import { EmpathyRepositoryImpl } from '@api/interface-adapters/repositories/EmpathyRepositoryImpl'
import { AuthSessionRepositoryImpl } from '@api/interface-adapters/repositories/AuthSessionRepositoryImpl'
import { PasswordHashServiceImpl } from '@api/interface-adapters/services/PasswordHashServiceImpl'
import { TokenServiceImpl } from '@api/interface-adapters/services/TokenServiceImpl'
import { UserRole } from '@api/domain/entities/User'
import {
  InvalidCredentialsError,
  AccountLockedError,
  AccountInactiveError,
  EmailNotVerifiedError,
} from '@api/domain/exceptions/AuthenticationError'

export class AdminController {
  private userRepository: UserRepositoryImpl
  private postRepository: PostRepositoryImpl
  private empathyRepository: EmpathyRepositoryImpl
  private authSessionRepository: AuthSessionRepositoryImpl
  private passwordHashService: PasswordHashServiceImpl
  private tokenService: TokenServiceImpl

  constructor() {
    this.userRepository = new UserRepositoryImpl()
    this.postRepository = new PostRepositoryImpl()
    this.empathyRepository = new EmpathyRepositoryImpl()
    this.authSessionRepository = new AuthSessionRepositoryImpl()
    this.passwordHashService = new PasswordHashServiceImpl()
    this.tokenService = new TokenServiceImpl()
  }

  private async getAdminUserFromRequest(request: NextRequest): Promise<string | null> {
    // Try to get token from Authorization header first
    const authHeader = request.headers.get('Authorization')
    let token = authHeader?.replace('Bearer ', '')

    // Fallback to cookie for backward compatibility
    if (!token) {
      token = request.cookies.get('admin-auth-token')?.value
    }

    if (!token) {
      return null
    }

    const userId = await this.tokenService.verifyAuthToken(token)
    if (!userId) {
      return null
    }

    // Verify user is admin
    const user = await this.userRepository.findById(userId)
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
      return null
    }

    return userId
  }

  async login(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json()
      const { email, password } = body

      if (!email || !password) {
        return NextResponse.json({ error: 'メールアドレスとパスワードが必要です' }, { status: 400 })
      }

      const adminLoginUseCase = new AdminLoginUseCase(
        this.userRepository,
        this.authSessionRepository,
        this.passwordHashService,
        this.tokenService
      )

      const result = await adminLoginUseCase.execute({ email, password })

      // Set admin cookie
      const response = NextResponse.json({
        success: true,
        token: result.token,
        user: {
          id: result.user.id,
          userName: result.user.userName,
          email: result.user.email,
          role: result.user.role,
        },
      })

      response.cookies.set('admin-auth-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/',
      })

      return response
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        return NextResponse.json(
          { error: 'メールアドレスまたはパスワードが正しくありません' },
          { status: 401 }
        )
      }
      if (error instanceof AccountLockedError) {
        return NextResponse.json(
          { error: 'アカウントが一時的にロックされています' },
          { status: 423 }
        )
      }
      if (error instanceof AccountInactiveError) {
        return NextResponse.json({ error: 'アカウントが無効です' }, { status: 403 })
      }
      if (error instanceof EmailNotVerifiedError) {
        return NextResponse.json({ error: 'メール認証が必要です' }, { status: 403 })
      }

      console.error('Admin login error:', error)
      return NextResponse.json({ error: 'ログインに失敗しました' }, { status: 500 })
    }
  }

  async getDashboardStats(request: NextRequest): Promise<NextResponse> {
    try {
      const adminUserId = await this.getAdminUserFromRequest(request)
      if (!adminUserId) {
        return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 })
      }

      const getDashboardStatsUseCase = new GetDashboardStatsUseCase(
        this.userRepository,
        this.postRepository,
        this.empathyRepository
      )

      const result = await getDashboardStatsUseCase.execute()

      return NextResponse.json({
        success: true,
        stats: result.stats,
      })
    } catch (error) {
      console.error('Get dashboard stats error:', error)
      return NextResponse.json({ error: '統計データの取得に失敗しました' }, { status: 500 })
    }
  }

  async getUsers(request: NextRequest): Promise<NextResponse> {
    try {
      const adminUserId = await this.getAdminUserFromRequest(request)
      if (!adminUserId) {
        return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 })
      }

      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '20')
      const search = url.searchParams.get('search') || undefined
      const status = (url.searchParams.get('status') as 'all' | 'active' | 'inactive') || 'all'
      const role = url.searchParams.get('role') || undefined

      const getAdminUsersUseCase = new GetAdminUsersUseCase(this.userRepository)

      const result = await getAdminUsersUseCase.execute({
        page,
        limit,
        search,
        status,
        role,
      })

      return NextResponse.json({
        success: true,
        users: result.users.map(user => ({
          id: user.id,
          userName: user.userName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          deletedAt: user.deletedAt,
        })),
        totalCount: result.totalCount,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Page') || error.message.includes('Limit')) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
      }

      console.error('Get users error:', error)
      return NextResponse.json({ error: 'ユーザー一覧の取得に失敗しました' }, { status: 500 })
    }
  }

  async activateUser(
    request: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const adminUserId = await this.getAdminUserFromRequest(request)
      if (!adminUserId) {
        return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 })
      }

      const userId = context.params.id

      // Update user to active
      await this.userRepository.update(userId, { active: true })

      return NextResponse.json({
        success: true,
        message: 'ユーザーを有効化しました',
      })
    } catch (error) {
      console.error('Activate user error:', error)
      return NextResponse.json({ error: 'ユーザーの有効化に失敗しました' }, { status: 500 })
    }
  }

  async suspendUser(
    request: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const adminUserId = await this.getAdminUserFromRequest(request)
      if (!adminUserId) {
        return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 })
      }

      const userId = context.params.id

      // Update user to inactive
      await this.userRepository.update(userId, { active: false })

      return NextResponse.json({
        success: true,
        message: 'ユーザーを停止しました',
      })
    } catch (error) {
      console.error('Suspend user error:', error)
      return NextResponse.json({ error: 'ユーザーの停止に失敗しました' }, { status: 500 })
    }
  }

  async getPosts(request: NextRequest): Promise<NextResponse> {
    try {
      const adminUserId = await this.getAdminUserFromRequest(request)
      if (!adminUserId) {
        return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 })
      }

      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '20')
      const search = url.searchParams.get('search') || undefined
      const status = url.searchParams.get('status') || undefined

      const result = await this.postRepository.findMany({
        offset: (page - 1) * limit,
        limit,
        search,
        publishedOnly: status === 'published' ? true : false,
      })

      return NextResponse.json({
        success: true,
        posts: result.posts,
        totalCount: result.totalCount,
        currentPage: page,
        totalPages: Math.ceil(result.totalCount / limit),
      })
    } catch (error) {
      console.error('Get posts error:', error)
      return NextResponse.json({ error: '投稿一覧の取得に失敗しました' }, { status: 500 })
    }
  }

  async publishPost(
    request: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const adminUserId = await this.getAdminUserFromRequest(request)
      if (!adminUserId) {
        return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 })
      }

      const postId = context.params.id

      await this.postRepository.update(postId, { isPublished: true })

      return NextResponse.json({
        success: true,
        message: '投稿を公開しました',
      })
    } catch (error) {
      console.error('Publish post error:', error)
      return NextResponse.json({ error: '投稿の公開に失敗しました' }, { status: 500 })
    }
  }

  async unpublishPost(
    request: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const adminUserId = await this.getAdminUserFromRequest(request)
      if (!adminUserId) {
        return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 })
      }

      const postId = context.params.id

      await this.postRepository.update(postId, { isPublished: false })

      return NextResponse.json({
        success: true,
        message: '投稿を非公開にしました',
      })
    } catch (error) {
      console.error('Unpublish post error:', error)
      return NextResponse.json({ error: '投稿の非公開に失敗しました' }, { status: 500 })
    }
  }

  async deletePost(
    request: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const adminUserId = await this.getAdminUserFromRequest(request)
      if (!adminUserId) {
        return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 })
      }

      const postId = context.params.id

      await this.postRepository.delete(postId)

      return NextResponse.json({
        success: true,
        message: '投稿を削除しました',
      })
    } catch (error) {
      console.error('Delete post error:', error)
      return NextResponse.json({ error: '投稿の削除に失敗しました' }, { status: 500 })
    }
  }

  async exportUsers(request: NextRequest): Promise<NextResponse> {
    try {
      const adminUserId = await this.getAdminUserFromRequest(request)
      if (!adminUserId) {
        return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 })
      }

      // Get all users
      const result = await this.userRepository.findMany({
        offset: 0,
        limit: 10000, // Large limit to get all users
      })

      // Generate CSV
      const headers = ['ID', 'ユーザー名', 'メールアドレス', 'ロール', 'ステータス', '作成日']
      const csvData = [
        headers.join(','),
        ...result.users.map(user =>
          [
            user.id,
            user.userName,
            user.email,
            user.role,
            user.isActive ? '有効' : '無効',
            user.createdAt.toISOString().split('T')[0],
          ].join(',')
        ),
      ].join('\n')

      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="users.csv"',
        },
      })
    } catch (error) {
      console.error('Export users error:', error)
      return NextResponse.json(
        { error: 'ユーザーデータのエクスポートに失敗しました' },
        { status: 500 }
      )
    }
  }
}
