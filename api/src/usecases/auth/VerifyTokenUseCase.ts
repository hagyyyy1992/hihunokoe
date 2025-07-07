import { User } from '@api/domain/entities/User'
import { UserRepository } from '@api/domain/repositories/UserRepository'
import { TokenService } from '@api/domain/services/TokenService'

export interface VerifyTokenInput {
  token: string
}

export interface VerifyTokenOutput {
  user: User | null
  isValid: boolean
}

export class VerifyTokenUseCase {
  constructor(
    private userRepository: UserRepository,
    private tokenService: TokenService
  ) {}

  async execute(input: VerifyTokenInput): Promise<VerifyTokenOutput> {
    try {
      // トークンを検証してユーザーIDを取得
      const userId = await this.tokenService.verifyAuthToken(input.token)

      if (!userId) {
        return {
          user: null,
          isValid: false,
        }
      }

      // ユーザー情報を取得
      const user = await this.userRepository.findById(userId)

      if (!user || user.deletedAt) {
        return {
          user: null,
          isValid: false,
        }
      }

      // アクティブユーザーかチェック
      if (!user.active) {
        return {
          user: null,
          isValid: false,
        }
      }

      return {
        user,
        isValid: true,
      }
    } catch (error) {
      return {
        user: null,
        isValid: false,
      }
    }
  }
}
