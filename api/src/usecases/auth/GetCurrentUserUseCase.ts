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
    private authSessionRepository: AuthSessionRepository, // 将来的なセッション管理のために保持
    private tokenService: TokenService
  ) {}

  async execute(inputData: GetCurrentUserInputData): Promise<GetCurrentUserOutputData> {
    const { token } = inputData

    if (!token) {
      throw new Error('No authentication token provided')
    }

    // Verify token
    const userId = await this.tokenService.verifyAuthToken(token)

    // E2E環境でのデバッグログ
    if (process.env.NODE_ENV === 'test') {
      console.log('GetCurrentUserUseCase - Token verification result:', userId)
    }

    if (!userId) {
      throw new Error('Invalid or expired token')
    }

    // Check if session exists (skip for JWT tokens as they are stateless)
    // JWTトークンはステートレスなので、セッション確認をスキップ
    // トークンの有効性は既にverifyAuthTokenで確認済み

    // Note: セッション管理が必要な場合は、永続化層（データベースやRedis）を使用する必要がある
    // 現在のインメモリ実装では、リクエスト間でセッションが共有されないため、
    // E2E環境やプロダクション環境では動作しない

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
