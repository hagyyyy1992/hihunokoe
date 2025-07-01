import { NextRequest, NextResponse } from 'next/server'
import { GetUserInputPort } from '../../usecases/user/GetUserInputPort'
import { verifyToken, AuthUser } from '../../../../src/lib/auth/auth'
import { User } from '../../domain/entities/User'

export class UserController {
  private getUserInputPort: GetUserInputPort

  constructor(getUserInputPort: GetUserInputPort) {
    this.getUserInputPort = getUserInputPort
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
      // Add other fields as needed when domain entity expands
    }
  }

  async getMe(request: NextRequest): Promise<NextResponse> {
    try {
      const token = request.cookies.get('auth-token')?.value

      if (!token) {
        return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
      }

      const decoded = verifyToken(token)

      if (!decoded) {
        return NextResponse.json({ error: 'トークンが無効です' }, { status: 401 })
      }

      const result = await this.getUserInputPort.execute({ userId: decoded.id })

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
