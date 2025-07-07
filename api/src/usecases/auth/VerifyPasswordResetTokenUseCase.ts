import { UserRepository } from '@api/domain/repositories/UserRepository'
import { TokenService } from '@api/domain/services/TokenService'

export interface VerifyPasswordResetTokenInput {
  token: string
}

export interface VerifyPasswordResetTokenOutput {
  success: boolean
  message: string
}

export class VerifyPasswordResetTokenUseCase {
  constructor(
    private userRepository: UserRepository,
    private tokenService: TokenService
  ) {}

  async execute(input: VerifyPasswordResetTokenInput): Promise<VerifyPasswordResetTokenOutput> {
    try {
      // トークンを検証
      const userId = await this.tokenService.verifyPasswordResetToken(input.token)

      if (!userId) {
        return {
          success: false,
          message: 'トークンが無効または期限切れです',
        }
      }

      // ユーザーの存在確認
      const user = await this.userRepository.findById(userId)
      if (!user || user.deletedAt) {
        return {
          success: false,
          message: 'トークンが無効です',
        }
      }

      return {
        success: true,
        message: 'トークンは有効です',
      }
    } catch (error) {
      console.error('Token verification error:', error)
      return {
        success: false,
        message: 'トークンが無効または期限切れです',
      }
    }
  }
}
