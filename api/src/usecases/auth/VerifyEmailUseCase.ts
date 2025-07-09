import { UserRepository } from '@api/domain/repositories/UserRepository'
import { TokenService } from '@api/domain/services/TokenService'

export interface VerifyEmailInputData {
  token: string
}

export interface VerifyEmailOutputData {
  success: boolean
  message: string
}

export class VerifyEmailUseCase {
  constructor(
    private userRepository: UserRepository,
    private tokenService: TokenService
  ) {}

  async execute(inputData: VerifyEmailInputData): Promise<VerifyEmailOutputData> {
    const { token } = inputData

    // Find user by email verification token
    const user = await this.userRepository.findByEmailVerificationToken(token)
    if (!user) {
      throw new Error('Invalid or expired verification token')
    }

    // Check if already verified
    if (user.emailVerified) {
      return {
        success: true,
        message: 'メールアドレスは既に確認済みです。',
      }
    }

    // Update user email verification status
    await this.userRepository.verifyEmail(user.id)

    // Invalidate the verification token
    await this.tokenService.invalidateEmailToken(token)

    return {
      success: true,
      message: 'メールアドレスが正常に確認されました。',
    }
  }
}
