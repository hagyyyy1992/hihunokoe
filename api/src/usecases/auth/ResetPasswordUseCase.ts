import { User } from '@api/domain/entities/User'
import { UserRepository } from '@api/domain/repositories/UserRepository'
import { PasswordHashService } from '@api/domain/services/PasswordHashService'
import { TokenService } from '@api/domain/services/TokenService'

export interface ResetPasswordInputData {
  token: string
  password: string
}

export interface ResetPasswordOutputData {
  success: boolean
  message: string
}

export class ResetPasswordUseCase {
  constructor(
    private userRepository: UserRepository,
    private passwordHashService: PasswordHashService,
    private tokenService: TokenService
  ) {}

  async execute(inputData: ResetPasswordInputData): Promise<ResetPasswordOutputData> {
    const { token, password } = inputData

    // Validate password
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    // Verify reset token
    const userId = await this.tokenService.verifyPasswordResetToken(token)
    if (!userId) {
      throw new Error('Invalid or expired reset token')
    }

    // Find user
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Check if user is active
    if (!user.isActive || user.deletedAt) {
      throw new Error('Account is inactive')
    }

    // Hash new password
    const hashedPassword = await this.passwordHashService.hash(password)

    // Update user password
    await this.userRepository.updatePassword(userId, hashedPassword)

    // Invalidate the reset token
    await this.tokenService.invalidatePasswordResetToken(token)

    return {
      success: true,
      message: 'パスワードが正常にリセットされました。',
    }
  }
}
