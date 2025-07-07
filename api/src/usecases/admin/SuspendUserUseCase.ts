import { UserRepository } from '@api/domain/repositories/UserRepository'

export interface SuspendUserRequest {
  userId: string
  adminUserId: string
  ipAddress: string
  userAgent: string
}

export interface SuspendUserResponse {
  message: string
  user: {
    id: string
    userName: string
    email: string
  }
}

export class SuspendUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(request: SuspendUserRequest): Promise<SuspendUserResponse> {
    const { userId, adminUserId, ipAddress, userAgent } = request

    // Verify admin user exists and has admin privileges
    const adminUser = await this.userRepository.findById(adminUserId)
    if (!adminUser || !adminUser.isAdmin()) {
      throw new Error('Admin privileges required')
    }

    // Find the user to suspend
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Suspend the user
    await this.userRepository.update(userId, { active: false })

    // Get the updated user
    const updatedUser = await this.userRepository.findById(userId)
    if (!updatedUser) {
      throw new Error('Failed to update user')
    }

    return {
      message: 'User suspended successfully',
      user: {
        id: updatedUser.id,
        userName: updatedUser.username,
        email: updatedUser.email,
      },
    }
  }
}
