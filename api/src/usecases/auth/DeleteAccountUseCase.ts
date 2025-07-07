import { UserRepository } from '@api/domain/repositories/UserRepository'
import { PasswordHashService } from '@api/domain/services/PasswordHashService'
import { AuthSessionRepository } from '@api/domain/repositories/AuthSessionRepository'
import { TokenService } from '@api/domain/services/TokenService'

export interface DeleteAccountInputData {
  token: string
  password: string
}

export interface DeleteAccountOutputData {
  success: boolean
  message: string
}

export class DeleteAccountUseCase {
  constructor(
    private userRepository: UserRepository,
    private passwordHashService: PasswordHashService,
    private authSessionRepository: AuthSessionRepository,
    private tokenService: TokenService
  ) {}

  async execute(inputData: DeleteAccountInputData): Promise<DeleteAccountOutputData> {
    const { token, password } = inputData

    if (!token) {
      throw new Error('No authentication token provided')
    }

    if (!password) {
      throw new Error('Password is required')
    }

    // Verify token
    const userId = await this.tokenService.verifyAuthToken(token)
    if (!userId) {
      throw new Error('Invalid or expired token')
    }

    // Get user
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Verify password
    const isPasswordValid = await this.passwordHashService.compare(password, user.password)
    if (!isPasswordValid) {
      throw new Error('Invalid password')
    }

    // Soft delete user (set deletedAt timestamp)
    await this.userRepository.softDelete(userId)

    // Invalidate all user sessions
    await this.authSessionRepository.invalidateAllUserSessions(userId)

    return {
      success: true,
      message: 'アカウントが正常に削除されました。',
    }
  }
}
