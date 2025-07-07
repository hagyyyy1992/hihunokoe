import { User } from '@api/domain/entities/User'
import { UserRepository } from '@api/domain/repositories/UserRepository'
import { AuthSessionRepository } from '@api/domain/repositories/AuthSessionRepository'
import { TokenService } from '@api/domain/services/TokenService'

export interface GetCurrentUserInputData {
  token: string
}

export interface GetCurrentUserOutputData {
  user: User
}

export class GetCurrentUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private authSessionRepository: AuthSessionRepository,
    private tokenService: TokenService
  ) {}

  async execute(inputData: GetCurrentUserInputData): Promise<GetCurrentUserOutputData> {
    const { token } = inputData

    if (!token) {
      throw new Error('No authentication token provided')
    }

    // Verify token
    const userId = await this.tokenService.verifyAuthToken(token)
    if (!userId) {
      throw new Error('Invalid or expired token')
    }

    // Check if session exists
    const session = await this.authSessionRepository.findByToken(token)
    if (!session || !session.isValid || session.expiresAt < new Date()) {
      throw new Error('Session expired')
    }

    // Get user
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Check if user is active
    if (!user.isActive || user.deletedAt) {
      throw new Error('Account is inactive')
    }

    return {
      user,
    }
  }
}
