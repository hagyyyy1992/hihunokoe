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
      // Find user by password reset token
      const user = await this.userRepository.findByPasswordResetToken(input.token)

      if (!user) {
        return {
          success: false,
          message: '無効なトークンまたは期限切れです',
        }
      }

      // トークンの有効期限をチェック
      if (user.passwordResetExpires && new Date(user.passwordResetExpires) < new Date()) {
        return {
          success: false,
          message: '無効なトークンまたは期限切れです',
        }
      }

      // ユーザーがアクティブか確認
      if (!user.isActive || user.deletedAt) {
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
        message: '無効なトークンまたは期限切れです',
      }
    }
  }
}
