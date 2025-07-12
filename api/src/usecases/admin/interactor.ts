import { User, UserRole } from '@api/domain/entities/User'
import { IUserRepository } from '@api/domain/repositories/UserRepository'
import { IPostRepository } from '@api/domain/repositories/PostRepository'
import { ICommentRepository } from '@api/domain/repositories/CommentRepository'
import { IAuthSessionRepository } from '@api/domain/repositories/AuthSessionRepository'
import { IAdminLogRepository } from '@api/domain/repositories/AdminLogRepository'
import { PasswordHashService } from '@api/domain/services/PasswordHashService'
import { TokenService } from '@api/domain/services/TokenService'
import { AuthSession } from '@api/domain/entities/AuthSession'
import {
  InvalidCredentialsError,
  AccountLockedError,
  AccountInactiveError,
  EmailNotVerifiedError,
} from '@api/domain/exceptions/AuthenticationError'
import {
  IAdminAuthenticationUseCase,
  IAdminUserManagementUseCase,
  IAdminPostManagementUseCase,
  IAdminDashboardUseCase,
  AdminLoginInputPort,
  AdminLogoutInputPort,
  GetCurrentAdminInputPort,
  ActivateUserInputPort,
  SuspendUserInputPort,
  GetAdminUsersInputPort,
  ExportUsersInputPort,
  AdminDeletePostInputPort,
  PublishPostInputPort,
  UnpublishPostInputPort,
  GetAdminPostsInputPort,
  GetDashboardStatsInputPort,
} from './input-port'
import {
  AdminLoginOutputPort,
  ActivateUserOutputPort,
  SuspendUserOutputPort,
  GetAdminUsersOutputPort,
  ExportUsersOutputPort,
  AdminDeletePostOutputPort,
  PublishPostOutputPort,
  UnpublishPostOutputPort,
  GetAdminPostsOutputPort,
  GetDashboardStatsOutputPort,
} from './output-port'

export class AdminAuthenticationUseCase implements IAdminAuthenticationUseCase {
  constructor(
    private userRepository: IUserRepository,
    private authSessionRepository: IAuthSessionRepository,
    private passwordHashService: PasswordHashService,
    private tokenService: TokenService,
    private adminLogRepository: IAdminLogRepository
  ) {}

  async adminLogin(inputData: AdminLoginInputPort): Promise<AdminLoginOutputPort> {
    const { email, password } = inputData

    // Find user by email
    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      throw new InvalidCredentialsError()
    }

    // Check if user is an admin
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new InvalidCredentialsError()
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AccountLockedError()
    }

    // Check if account is active
    if (!user.isActive || user.deletedAt) {
      throw new AccountInactiveError()
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new EmailNotVerifiedError()
    }

    // Verify password
    const isPasswordValid = await this.passwordHashService.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      // Increment failed login attempts
      await this.userRepository.incrementFailedLoginAttempts(user.id)

      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts + 1 >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        await this.userRepository.lockAccount(user.id, lockUntil)
        throw new AccountLockedError()
      }

      throw new InvalidCredentialsError()
    }

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await this.userRepository.resetFailedLoginAttempts(user.id)
    }

    // Generate token
    const token = await this.tokenService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      userName: user.userName,
    })

    // Create session
    const session = new AuthSession(
      crypto.randomUUID(),
      user.id,
      token,
      new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours for admin sessions
      new Date()
    )
    await this.authSessionRepository.create(session)

    return {
      token,
      user,
    }
  }

  async adminLogout(inputData: AdminLogoutInputPort): Promise<void> {
    const { adminUserId } = inputData

    // Delete all sessions for the admin user
    await this.authSessionRepository.deleteByUserId(adminUserId)
  }

  async getCurrentAdmin(inputData: GetCurrentAdminInputPort): Promise<{ user: User }> {
    const { adminUserId } = inputData

    // Find admin user
    const user = await this.userRepository.findById(adminUserId)
    if (!user) {
      throw new Error('管理者が見つかりません')
    }

    // Verify admin role
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new Error('権限がありません')
    }

    return { user }
  }
}

export class AdminUserManagementUseCase implements IAdminUserManagementUseCase {
  constructor(
    private userRepository: IUserRepository,
    private adminLogRepository: IAdminLogRepository
  ) {}

  async activateUser(inputData: ActivateUserInputPort): Promise<ActivateUserOutputPort> {
    const { adminUserId, targetUserId } = inputData

    // Verify admin user exists and has permission
    const adminUser = await this.userRepository.findById(adminUserId)
    if (
      !adminUser ||
      (adminUser.role !== UserRole.ADMIN && adminUser.role !== UserRole.SUPER_ADMIN)
    ) {
      throw new Error('権限がありません')
    }

    // Find target user
    const targetUser = await this.userRepository.findById(targetUserId)
    if (!targetUser) {
      throw new Error('ユーザーが見つかりません')
    }

    // Activate user
    const updatedUser = await this.userRepository.update(targetUserId, {
      active: true,
    })

    return {
      user: updatedUser,
      message: 'ユーザーをアクティベートしました',
    }
  }

  async suspendUser(inputData: SuspendUserInputPort): Promise<SuspendUserOutputPort> {
    const { adminUserId, targetUserId, reason } = inputData

    // Verify admin user exists and has permission
    const adminUser = await this.userRepository.findById(adminUserId)
    if (
      !adminUser ||
      (adminUser.role !== UserRole.ADMIN && adminUser.role !== UserRole.SUPER_ADMIN)
    ) {
      throw new Error('権限がありません')
    }

    // Find target user
    const targetUser = await this.userRepository.findById(targetUserId)
    if (!targetUser) {
      throw new Error('ユーザーが見つかりません')
    }

    // Cannot suspend other admins
    if (targetUser.role === UserRole.ADMIN || targetUser.role === UserRole.SUPER_ADMIN) {
      throw new Error('管理者アカウントは停止できません')
    }

    // Suspend user
    const updatedUser = await this.userRepository.update(targetUserId, {
      active: false,
    })

    return {
      user: updatedUser,
      message: 'ユーザーを停止しました',
    }
  }

  async getAdminUsers(inputData: GetAdminUsersInputPort): Promise<GetAdminUsersOutputPort> {
    const { adminUserId, page = 1, limit = 20, search, status } = inputData

    // Verify admin user exists and has permission
    const adminUser = await this.userRepository.findById(adminUserId)
    if (
      !adminUser ||
      (adminUser.role !== UserRole.ADMIN && adminUser.role !== UserRole.SUPER_ADMIN)
    ) {
      throw new Error('権限がありません')
    }

    const offset = (page - 1) * limit
    const filters: any = {}

    if (search) {
      filters.search = search
    }

    if (status && status !== 'all') {
      switch (status) {
        case 'active':
          filters.isActive = true
          filters.deletedAt = null
          break
        case 'suspended':
          filters.isActive = false
          filters.deletedAt = null
          break
        case 'deleted':
          filters.deletedAt = { not: null }
          break
      }
    }

    const { users, totalCount } = await this.userRepository.findMany({
      offset,
      limit,
      search,
      activeOnly: status === 'active' ? true : undefined,
      inactiveOnly: status === 'suspended' ? true : undefined,
    })

    const hasNext = offset + users.length < totalCount

    return {
      users,
      total: totalCount,
      page,
      limit,
      hasNext,
    }
  }

  async exportUsers(inputData: ExportUsersInputPort): Promise<ExportUsersOutputPort> {
    const { adminUserId, format, filters } = inputData

    // Verify admin user exists and has permission
    const adminUser = await this.userRepository.findById(adminUserId)
    if (
      !adminUser ||
      (adminUser.role !== UserRole.ADMIN && adminUser.role !== UserRole.SUPER_ADMIN)
    ) {
      throw new Error('権限がありません')
    }

    // Build query filters
    const queryFilters: any = {}
    if (filters?.status) {
      switch (filters.status) {
        case 'active':
          queryFilters.isActive = true
          queryFilters.deletedAt = null
          break
        case 'suspended':
          queryFilters.isActive = false
          queryFilters.deletedAt = null
          break
        case 'deleted':
          queryFilters.deletedAt = { not: null }
          break
      }
    }

    if (filters?.dateRange) {
      queryFilters.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      }
    }

    const { users } = await this.userRepository.findMany({
      offset: 0,
      limit: 10000,
      activeOnly: filters?.status === 'active' ? true : undefined,
      inactiveOnly: filters?.status === 'suspended' ? true : undefined,
    })

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')

    if (format === 'csv') {
      const csvData = this.convertUsersToCSV(users)
      return {
        data: csvData,
        filename: `users-export-${timestamp}.csv`,
        contentType: 'text/csv',
      }
    } else {
      const jsonData = users.map(user => ({
        id: user.id,
        email: user.email,
        userName: user.userName,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        deletedAt: user.deletedAt,
      }))
      return {
        data: jsonData,
        filename: `users-export-${timestamp}.json`,
        contentType: 'application/json',
      }
    }
  }

  private convertUsersToCSV(users: User[]): string {
    const headers = [
      'ID',
      'Email',
      'UserName',
      'Role',
      'IsActive',
      'EmailVerified',
      'CreatedAt',
      'DeletedAt',
    ]
    const rows = users.map(user => [
      user.id,
      user.email,
      user.userName,
      user.role,
      user.active,
      user.emailVerified,
      user.createdAt?.toISOString() || '',
      user.deletedAt?.toISOString() || '',
    ])

    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n')
  }
}

export class AdminPostManagementUseCase implements IAdminPostManagementUseCase {
  constructor(
    private postRepository: IPostRepository,
    private userRepository: IUserRepository,
    private adminLogRepository: IAdminLogRepository
  ) {}

  async deletePost(inputData: AdminDeletePostInputPort): Promise<AdminDeletePostOutputPort> {
    const { adminUserId, postId, reason } = inputData

    // Verify admin user exists and has permission
    const adminUser = await this.userRepository.findById(adminUserId)
    if (
      !adminUser ||
      (adminUser.role !== UserRole.ADMIN && adminUser.role !== UserRole.SUPER_ADMIN)
    ) {
      throw new Error('権限がありません')
    }

    // Find post
    const post = await this.postRepository.findById(postId)
    if (!post) {
      throw new Error('投稿が見つかりません')
    }

    // Delete post
    await this.postRepository.delete(postId)

    return {
      postId,
      message: '投稿を削除しました',
    }
  }

  async publishPost(inputData: PublishPostInputPort): Promise<PublishPostOutputPort> {
    const { adminUserId, postId } = inputData

    // Verify admin user exists and has permission
    const adminUser = await this.userRepository.findById(adminUserId)
    if (
      !adminUser ||
      (adminUser.role !== UserRole.ADMIN && adminUser.role !== UserRole.SUPER_ADMIN)
    ) {
      throw new Error('権限がありません')
    }

    // Find post
    const post = await this.postRepository.findById(postId)
    if (!post) {
      throw new Error('投稿が見つかりません')
    }

    // Publish post
    const updatedPost = await this.postRepository.update(postId, {
      isPublished: true,
    })

    return {
      post: updatedPost,
      message: '投稿を公開しました',
    }
  }

  async unpublishPost(inputData: UnpublishPostInputPort): Promise<UnpublishPostOutputPort> {
    const { adminUserId, postId, reason } = inputData

    // Verify admin user exists and has permission
    const adminUser = await this.userRepository.findById(adminUserId)
    if (
      !adminUser ||
      (adminUser.role !== UserRole.ADMIN && adminUser.role !== UserRole.SUPER_ADMIN)
    ) {
      throw new Error('権限がありません')
    }

    // Find post
    const post = await this.postRepository.findById(postId)
    if (!post) {
      throw new Error('投稿が見つかりません')
    }

    // Unpublish post
    const updatedPost = await this.postRepository.update(postId, {
      isPublished: false,
    })

    return {
      post: updatedPost,
      message: '投稿を非公開にしました',
    }
  }

  async getAdminPosts(inputData: GetAdminPostsInputPort): Promise<GetAdminPostsOutputPort> {
    const { adminUserId, page = 1, limit = 20, search, status } = inputData

    // Verify admin user exists and has permission
    const adminUser = await this.userRepository.findById(adminUserId)
    if (
      !adminUser ||
      (adminUser.role !== UserRole.ADMIN && adminUser.role !== UserRole.SUPER_ADMIN)
    ) {
      throw new Error('権限がありません')
    }

    const offset = (page - 1) * limit
    const filters: any = {}

    if (search) {
      filters.search = search
    }

    if (status && status !== 'all') {
      switch (status) {
        case 'published':
          filters.isPublished = true
          filters.deletedAt = null
          break
        case 'unpublished':
          filters.isPublished = false
          filters.deletedAt = null
          break
        case 'deleted':
          filters.deletedAt = { not: null }
          break
      }
    }

    const { posts, totalCount } = await this.postRepository.findMany({
      offset,
      limit,
      search,
      publishedOnly: status === 'published' ? true : undefined,
    })

    const hasNext = offset + posts.length < totalCount

    return {
      posts,
      total: totalCount,
      page,
      limit,
      hasNext,
    }
  }
}

export class AdminDashboardUseCase implements IAdminDashboardUseCase {
  constructor(
    private userRepository: IUserRepository,
    private postRepository: IPostRepository,
    private commentRepository: ICommentRepository
  ) {}

  async getDashboardStats(
    inputData: GetDashboardStatsInputPort
  ): Promise<GetDashboardStatsOutputPort> {
    const { adminUserId, dateRange } = inputData

    // Verify admin user exists and has permission
    const adminUser = await this.userRepository.findById(adminUserId)
    if (
      !adminUser ||
      (adminUser.role !== UserRole.ADMIN && adminUser.role !== UserRole.SUPER_ADMIN)
    ) {
      throw new Error('権限がありません')
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Execute all count queries in parallel
    const [
      { totalCount: totalUsers },
      { totalCount: activeUsers },
      { totalCount: suspendedUsers },
      { totalCount: totalPosts },
      { totalCount: publishedPosts },
      { totalCount: todayRegistrations },
      { totalCount: todayPosts },
      userGrowth,
      postGrowth,
    ] = await Promise.all([
      this.userRepository.findMany({ offset: 0, limit: 0 }),
      this.userRepository.findMany({ offset: 0, limit: 0, activeOnly: true }),
      this.userRepository.findMany({ offset: 0, limit: 0, inactiveOnly: true }),
      this.postRepository.findMany({ offset: 0, limit: 0 }),
      this.postRepository.findMany({ offset: 0, limit: 0, publishedOnly: true }),
      this.userRepository.findMany({ offset: 0, limit: 0, createdAfter: today }),
      this.postRepository.findMany({ offset: 0, limit: 0, createdAfter: today }),
      this.getUserGrowthDataOptimized(thirtyDaysAgo, now),
      this.getPostGrowthDataOptimized(thirtyDaysAgo, now),
    ])
    
    console.log('Dashboard stats debug:', {
      totalPosts,
      publishedPosts,
      unpublishedCalculation: totalPosts - publishedPosts,
    })

    // Ensure unpublishedPosts is never negative
    const unpublishedPosts = Math.max(0, totalPosts - publishedPosts)
    const totalComments = 0 // TODO: Implement comment counting
    const todayComments = 0 // TODO: Implement comment counting

    return {
      stats: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        totalPosts,
        publishedPosts,
        unpublishedPosts,
        totalComments,
        todayRegistrations,
        todayPosts,
        todayComments,
      },
      userGrowth,
      postGrowth,
    }
  }

  private async getUserGrowthData(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; count: number }>> {
    // This would need to be implemented based on your database querying capabilities
    // For now, return mock data
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const growth = []

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)

      const { totalCount: count } = await this.userRepository.findMany({
        offset: 0,
        limit: 0,
        createdAfter: date,
      })

      growth.push({
        date: date.toISOString().split('T')[0],
        count,
      })
    }

    return growth
  }

  private async getPostGrowthData(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; count: number }>> {
    // This would need to be implemented based on your database querying capabilities
    // For now, return mock data
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const growth = []

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)

      const { totalCount: count } = await this.postRepository.findMany({
        offset: 0,
        limit: 0,
        createdAfter: date,
      })

      growth.push({
        date: date.toISOString().split('T')[0],
        count,
      })
    }

    return growth
  }

  // Optimized methods that avoid N+1 queries
  private async getUserGrowthDataOptimized(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; count: number }>> {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const growth = []
    
    // TODO: Replace with single aggregation query
    // For now, return mock data to avoid performance issues
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      growth.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 10), // Mock data
      })
    }
    
    return growth
  }

  private async getPostGrowthDataOptimized(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; count: number }>> {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const growth = []
    
    // TODO: Replace with single aggregation query
    // For now, return mock data to avoid performance issues
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      growth.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 5), // Mock data
      })
    }
    
    return growth
  }
}
