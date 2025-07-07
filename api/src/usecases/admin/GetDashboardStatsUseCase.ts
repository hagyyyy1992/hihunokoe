import { UserRepository } from '@api/domain/repositories/UserRepository'
import { PostRepository } from '@api/domain/repositories/PostRepository'
import { EmpathyRepository } from '@api/domain/repositories/EmpathyRepository'

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalPosts: number
  publishedPosts: number
  totalEmpathies: number
  recentUsers: number
  recentPosts: number
}

export interface GetDashboardStatsOutputData {
  stats: DashboardStats
}

export class GetDashboardStatsUseCase {
  constructor(
    private userRepository: UserRepository,
    private postRepository: PostRepository,
    private empathyRepository: EmpathyRepository
  ) {}

  async execute(): Promise<GetDashboardStatsOutputData> {
    // Get basic counts
    const [totalUsersResult, activeUsersResult, totalPostsResult, publishedPostsResult] =
      await Promise.all([
        this.userRepository.findMany({ offset: 0, limit: 1, publishedOnly: false }),
        this.userRepository.findMany({
          offset: 0,
          limit: 1,
          activeOnly: true,
          publishedOnly: false,
        }),
        this.postRepository.findMany({ offset: 0, limit: 1, publishedOnly: false }),
        this.postRepository.findMany({ offset: 0, limit: 1, publishedOnly: true }),
      ])

    // Get recent counts (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [recentUsersResult, recentPostsResult] = await Promise.all([
      this.userRepository.findMany({
        offset: 0,
        limit: 1,
        createdAfter: thirtyDaysAgo,
        publishedOnly: false,
      }),
      this.postRepository.findMany({
        offset: 0,
        limit: 1,
        createdAfter: thirtyDaysAgo,
        publishedOnly: false,
      }),
    ])

    // Get total empathies count
    const totalEmpathies = await this.empathyRepository.countTotal()

    const stats: DashboardStats = {
      totalUsers: totalUsersResult.totalCount,
      activeUsers: activeUsersResult.totalCount,
      totalPosts: totalPostsResult.totalCount,
      publishedPosts: publishedPostsResult.totalCount,
      totalEmpathies,
      recentUsers: recentUsersResult.totalCount,
      recentPosts: recentPostsResult.totalCount,
    }

    return { stats }
  }
}
