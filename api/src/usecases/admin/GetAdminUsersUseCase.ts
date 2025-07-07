import { User } from '@api/domain/entities/User'
import { UserRepository } from '@api/domain/repositories/UserRepository'

export interface GetAdminUsersInputData {
  page?: number
  limit?: number
  search?: string
  status?: 'all' | 'active' | 'inactive'
  role?: string
}

export interface GetAdminUsersOutputData {
  users: User[]
  totalCount: number
  currentPage: number
  totalPages: number
}

export class GetAdminUsersUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(inputData: GetAdminUsersInputData): Promise<GetAdminUsersOutputData> {
    const { page = 1, limit = 20, search, status = 'all', role } = inputData

    // Validate pagination parameters
    if (page < 1) {
      throw new Error('Page must be greater than 0')
    }

    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100')
    }

    const offset = (page - 1) * limit

    // Build filters
    const filters: any = {
      offset,
      limit,
      publishedOnly: false, // Admin can see all users
    }

    if (search?.trim()) {
      filters.search = search.trim()
    }

    if (status === 'active') {
      filters.activeOnly = true
    } else if (status === 'inactive') {
      filters.inactiveOnly = true
    }

    if (role?.trim()) {
      filters.role = role.trim()
    }

    // Get users with filters
    const result = await this.userRepository.findMany(filters)

    const totalPages = Math.ceil(result.totalCount / limit)

    return {
      users: result.users,
      totalCount: result.totalCount,
      currentPage: page,
      totalPages,
    }
  }
}
