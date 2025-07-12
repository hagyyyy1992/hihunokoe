import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  AdminAuthenticationUseCase,
  AdminUserManagementUseCase,
  AdminPostManagementUseCase,
  AdminDashboardUseCase,
} from '@api/usecases/admin/interactor'
import type {
  AdminLoginInputPort,
  ActivateUserInputPort,
  SuspendUserInputPort,
  GetAdminUsersInputPort,
  ExportUsersInputPort,
  AdminDeletePostInputPort,
  PublishPostInputPort,
  UnpublishPostInputPort,
  GetAdminPostsInputPort,
  GetDashboardStatsInputPort,
  AdminLogoutInputPort,
  GetCurrentAdminInputPort,
} from '@api/usecases/admin/input-port'
import { UserRepository } from '@api/interface-adapters/repositories/User.repository'
import { PostRepository } from '@api/interface-adapters/repositories/Post.repository'
import { AuthSessionRepository } from '@api/interface-adapters/repositories/AuthSession.repository'
import { AdminLogRepository } from '@api/interface-adapters/repositories/AdminLog.repository'
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
  private adminAuthenticationUseCase: AdminAuthenticationUseCase
  private adminUserManagementUseCase: AdminUserManagementUseCase
  private adminPostManagementUseCase: AdminPostManagementUseCase
  private adminDashboardUseCase: AdminDashboardUseCase
  private tokenService: TokenServiceImpl

  constructor() {
    const userRepository = new UserRepository()
    const postRepository = new PostRepository()
    const authSessionRepository = new AuthSessionRepository()
    const passwordHashService = new PasswordHashServiceImpl()
    this.tokenService = new TokenServiceImpl()
    const commentRepository =
      new (require('@api/interface-adapters/repositories/Comment.repository').CommentRepository)()

    if (!prisma) {
      throw new Error('Prisma client is not initialized')
    }
    const adminLogRepository = new AdminLogRepository(prisma)

    this.adminAuthenticationUseCase = new AdminAuthenticationUseCase(
      userRepository,
      authSessionRepository,
      passwordHashService,
      this.tokenService,
      adminLogRepository
    )
    this.adminUserManagementUseCase = new AdminUserManagementUseCase(
      userRepository,
      adminLogRepository
    )
    this.adminPostManagementUseCase = new AdminPostManagementUseCase(
      postRepository,
      userRepository,
      adminLogRepository
    )
    this.adminDashboardUseCase = new AdminDashboardUseCase(
      userRepository,
      postRepository,
      commentRepository
    )
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

    try {
      const decoded = await this.tokenService.verifyToken(token)
      return decoded.userId
    } catch {
      return null
    }
  }

  async login(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json()
      const { email, password } = body

      if (!email || !password) {
        return NextResponse.json({ error: 'メールアドレスとパスワードが必要です' }, { status: 400 })
      }

      // Get IP address and user agent
      const ipAddress =
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'

      const inputPort: AdminLoginInputPort = { email, password, ipAddress, userAgent }
      const result = await this.adminAuthenticationUseCase.adminLogin(inputPort)

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
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
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
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      console.error('Error message:', error instanceof Error ? error.message : String(error))
      return NextResponse.json({ error: 'ログインに失敗しました' }, { status: 500 })
    }
  }

  async getDashboardStats(request: NextRequest): Promise<NextResponse> {
    try {
      const adminUserId = await this.getAdminUserFromRequest(request)
      if (!adminUserId) {
        return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 })
      }

      const inputPort: GetDashboardStatsInputPort = { adminUserId }
      const result = await this.adminDashboardUseCase.getDashboardStats(inputPort)

      return NextResponse.json({
        success: true,
        stats: result.stats,
        userGrowth: result.userGrowth,
        postGrowth: result.postGrowth,
        recentUsers: result.recentUsers,
        recentPosts: result.recentPosts,
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
      const status =
        (url.searchParams.get('status') as 'all' | 'active' | 'suspended' | 'deleted') || 'all'
      const role = url.searchParams.get('role') || undefined

      const inputPort: GetAdminUsersInputPort = {
        adminUserId,
        page,
        limit,
        search,
        status,
        role: role as UserRole | undefined,
      }
      const result = await this.adminUserManagementUseCase.getAdminUsers(inputPort)

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
        totalCount: result.total,
        currentPage: result.page,
        totalPages: Math.ceil(result.total / result.limit),
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

      const inputPort: ActivateUserInputPort = {
        adminUserId,
        targetUserId: userId,
      }
      await this.adminUserManagementUseCase.activateUser(inputPort)

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

      const inputPort: SuspendUserInputPort = {
        adminUserId,
        targetUserId: userId,
      }
      await this.adminUserManagementUseCase.suspendUser(inputPort)

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

      const inputPort: GetAdminPostsInputPort = {
        adminUserId,
        page,
        limit,
        search,
        status: status as 'all' | 'published' | 'unpublished' | undefined,
      }
      const result = await this.adminPostManagementUseCase.getAdminPosts(inputPort)

      return NextResponse.json({
        success: true,
        posts: result.posts,
        totalCount: result.total,
        currentPage: page,
        totalPages: Math.ceil(result.total / limit),
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

      const inputPort: PublishPostInputPort = {
        adminUserId,
        postId,
      }
      await this.adminPostManagementUseCase.publishPost(inputPort)

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

      const inputPort: UnpublishPostInputPort = {
        adminUserId,
        postId,
      }
      await this.adminPostManagementUseCase.unpublishPost(inputPort)

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

      const inputPort: AdminDeletePostInputPort = {
        adminUserId,
        postId,
      }
      await this.adminPostManagementUseCase.deletePost(inputPort)

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

      const inputPort: ExportUsersInputPort = {
        adminUserId,
        format: 'csv',
      }
      const result = await this.adminUserManagementUseCase.exportUsers(inputPort)

      return new NextResponse(result.data as string, {
        headers: {
          'Content-Type': result.contentType,
          'Content-Disposition': `attachment; filename="${result.filename}"`,
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

  async logout(request: NextRequest): Promise<NextResponse> {
    try {
      const adminUserId = await this.getAdminUserFromRequest(request)
      if (!adminUserId) {
        return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 })
      }

      const inputPort: AdminLogoutInputPort = {
        adminUserId,
      }
      await this.adminAuthenticationUseCase.adminLogout(inputPort)

      const response = NextResponse.json({
        success: true,
        message: 'ログアウトしました',
      })

      // Clear admin cookie
      response.cookies.delete('admin-auth-token')

      return response
    } catch (error) {
      console.error('Admin logout error:', error)
      return NextResponse.json({ error: 'ログアウトに失敗しました' }, { status: 500 })
    }
  }

  async getCurrentAdmin(request: NextRequest): Promise<NextResponse> {
    try {
      const adminUserId = await this.getAdminUserFromRequest(request)
      if (!adminUserId) {
        return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 })
      }

      const inputPort: GetCurrentAdminInputPort = {
        adminUserId,
      }
      const result = await this.adminAuthenticationUseCase.getCurrentAdmin(inputPort)

      return NextResponse.json({
        success: true,
        user: {
          id: result.user.id,
          userName: result.user.userName,
          email: result.user.email,
          role: result.user.role,
        },
      })
    } catch (error) {
      console.error('Get current admin error:', error)
      return NextResponse.json({ error: '管理者情報の取得に失敗しました' }, { status: 500 })
    }
  }
}
