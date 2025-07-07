import { User } from '@api/domain/entities/User'
import { UserRepository } from '@api/domain/repositories/UserRepository'
import { EmailService } from '@api/domain/services/EmailService'
import { TokenService } from '@api/domain/services/TokenService'

export interface ForgotPasswordInputData {
  email: string
}

export interface ForgotPasswordOutputData {
  success: boolean
  message: string
}

export class ForgotPasswordUseCase {
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService,
    private tokenService: TokenService
  ) {}

  async execute(inputData: ForgotPasswordInputData): Promise<ForgotPasswordOutputData> {
    const { email } = inputData

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }

    // Find user by email
    const user = await this.userRepository.findByEmail(email)

    // Always return success for security reasons
    // Even if user doesn't exist, we don't reveal this information
    if (!user) {
      return {
        success: true,
        message: 'パスワードリセットメールを送信しました。メールをご確認ください。',
      }
    }

    // Check if user is active
    if (!user.isActive || user.deletedAt) {
      return {
        success: true,
        message: 'パスワードリセットメールを送信しました。メールをご確認ください。',
      }
    }

    // Generate password reset token
    const resetToken = await this.tokenService.generatePasswordResetToken(user.id)

    // Send password reset email
    try {
      await this.emailService.sendPasswordResetEmail(user.email, user.userName, resetToken)
    } catch (error) {
      console.error('Failed to send password reset email:', error)
      // Don't throw error for security reasons
    }

    return {
      success: true,
      message: 'パスワードリセットメールを送信しました。メールをご確認ください。',
    }
  }
}
