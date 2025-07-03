import { NextRequest, NextResponse } from 'next/server'
import { IGetUserInputPort } from '@api/usecases/user/input-port'
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
  private getUserInputPort: IGetUserInputPort
  private tokenService: TokenService
  private authSessionRepository: AuthSessionRepository

  constructor(
    getUserInputPort: IGetUserInputPort,
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
      role: domainUser.role,
    }
  }

  async getMe(request: NextRequest): Promise<NextResponse> {
    try {
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value

      if (!token) {
        return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
      }

      // JWTトークンを検証
      let payload
      try {
        payload = await this.tokenService.verifyToken(token)
      } catch (error) {
        return NextResponse.json({ error: 'トークンが無効です' }, { status: 401 })
      }

      const result = await this.getUserInputPort.execute({ userId: payload.userId })

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
