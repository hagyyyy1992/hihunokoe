import { NextRequest, NextResponse } from 'next/server'
import { GetUserInputPort } from '@api/usecases/user/GetUserInputPort'
import { User } from '@api/domain/entities/User'
import { TokenService } from '@api/domain/services/TokenService'
import { AuthSessionRepository } from '@api/domain/repositories/AuthSessionRepository'

interface AuthUser {
  id: string
  userName: string
  email: string
  emailVerified: boolean
  role?: string
}

export class UserController {
  private getUserInputPort: GetUserInputPort
  private tokenService: TokenService
  private authSessionRepository: AuthSessionRepository

  constructor(
    getUserInputPort: GetUserInputPort,
    tokenService: TokenService,
    authSessionRepository: AuthSessionRepository
  ) {
    this.getUserInputPort = getUserInputPort
    this.tokenService = tokenService
    this.authSessionRepository = authSessionRepository
  }

  /**
   * Convert domain User entity to AuthUser format for frontend compatibility
   */
  private convertUserToAuthUser(domainUser: User): AuthUser {
    return {
      id: domainUser.id,
      userName: domainUser.username, // Convert username to userName
      email: domainUser.email,
      emailVerified: domainUser.emailVerified,
      role: domainUser.role
    }
  }

  async getMe(request: NextRequest): Promise<NextResponse> {
    try {
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value

      if (!token) {
        return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
      }

      const session = await this.authSessionRepository.findByToken(token)
      if (!session || !session.isValid()) {
        return NextResponse.json({ error: 'トークンが無効です' }, { status: 401 })
      }

      const result = await this.getUserInputPort.execute({ userId: session.userId })

      const authUser = this.convertUserToAuthUser(result.user)
      return NextResponse.json({ user: authUser })
    } catch (error) {
      console.error('[Controller] Get user error:', error)

      if (error instanceof Error) {
        if (error.message === 'ユーザーが見つかりません') {
          return NextResponse.json({ error: error.message }, { status: 404 })
        }
        if (error.message === 'メールアドレスの確認が必要です') {
          return NextResponse.json({ error: error.message }, { status: 403 })
        }
      }

      return NextResponse.json({ error: 'ユーザー情報の取得に失敗しました' }, { status: 500 })
    }
  }
}
