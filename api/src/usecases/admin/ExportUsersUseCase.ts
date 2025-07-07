import { UserRepository } from '@api/domain/repositories/UserRepository'

export interface ExportUsersRequest {
  adminUserId: string
  ipAddress: string
  userAgent: string
}

export interface UserExportData {
  id: string
  userName: string
  email: string
  isActive: boolean
  role: string
  skinType: string
  createdAt: string
  postCount: number
}

export interface ExportUsersResponse {
  users: UserExportData[]
  csvContent: string
}

export class ExportUsersUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(request: ExportUsersRequest): Promise<ExportUsersResponse> {
    const { adminUserId, ipAddress, userAgent } = request

    // Verify admin user exists and has admin privileges
    const adminUser = await this.userRepository.findById(adminUserId)
    if (!adminUser || !adminUser.isAdmin()) {
      throw new Error('Admin privileges required')
    }

    try {
      // Get all users with post count
      const users = await this.userRepository.findAllWithPostCount()

      const userExportData: UserExportData[] = users.map(user => ({
        id: user.id,
        userName: user.username,
        email: user.email,
        isActive: user.active,
        role: user.role,
        skinType: '', // User entity doesn't have skinType in clean arch yet
        createdAt: user.createdAt.toISOString(),
        postCount: 0, // Will be populated by repository implementation
      }))

      // Generate CSV content
      const csvContent = this.generateCsvContent(userExportData)

      return {
        users: userExportData,
        csvContent,
      }
    } catch (error) {
      console.error('Export users error:', error)
      throw new Error('Failed to export users')
    }
  }

  private generateCsvContent(users: UserExportData[]): string {
    // CSV header
    const csvHeader = 'ID,ユーザー名,メールアドレス,ステータス,ロール,肌タイプ,投稿数,登録日\n'

    // CSV data
    const csvData = users
      .map(user => {
        const status = user.isActive ? 'アクティブ' : '停止中'
        const role =
          user.role === 'SUPER_ADMIN'
            ? 'スーパー管理者'
            : user.role === 'ADMIN'
              ? '管理者'
              : 'ユーザー'
        const createdAt = new Date(user.createdAt).toLocaleDateString('ja-JP')

        return `"${user.id}","${user.userName}","${user.email}","${status}","${role}","${user.skinType}",${user.postCount},"${createdAt}"`
      })
      .join('\n')

    return csvHeader + csvData
  }
}
