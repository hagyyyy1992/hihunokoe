import { UserRepository } from '@api/domain/repositories/UserRepository'
import { PasswordHashService } from '@api/domain/services/PasswordHashService'

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
    private passwordHashService: PasswordHashService
  ) {}

  async execute(inputData: ResetPasswordInputData): Promise<ResetPasswordOutputData> {
    const { token, password } = inputData

    // Validate password
    if (password.length < 8) {
      throw new Error('パスワードは8文字以上で入力してください')
    }

    // Find user by password reset token
    const user = await this.userRepository.findByPasswordResetToken(token)
    if (!user) {
      throw new Error('Invalid or expired reset token')
    }

    // Check if token is expired
    if (user.passwordResetExpires && new Date(user.passwordResetExpires) < new Date()) {
      throw new Error('Invalid or expired reset token')
    }

    // Check if user is active
    if (!user.isActive || user.deletedAt) {
      throw new Error('Account is inactive')
    }

    // Hash new password
    const hashedPassword = await this.passwordHashService.hash(password)

    // Update user password and clear reset token
    await this.userRepository.update(user.id, {
      passwordHash: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    })

    return {
      success: true,
      message: 'パスワードが正常にリセットされました。',
    }
  }
}
