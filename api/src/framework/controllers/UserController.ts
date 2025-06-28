import { NextRequest, NextResponse } from 'next/server'
import { GetUserUseCase } from '../../usecases/user/GetUserUseCase'
import { UserRepositoryImpl } from '../../interface-adapters/repositories/UserRepositoryImpl'
import { verifyToken } from '../../../../src/lib/auth/auth'

export class UserController {
  private getUserUseCase: GetUserUseCase

  constructor() {
    const userRepository = new UserRepositoryImpl()
    this.getUserUseCase = new GetUserUseCase(userRepository)
  }

  async getMe(request: NextRequest): Promise<NextResponse> {
    console.log('[Controller] UserController.getMe called')
    try {
      const token = request.cookies.get('auth-token')?.value
      console.log('[Controller] Token found:', !!token)

      if (!token) {
        console.log('[Controller] No token provided, returning 401')
        return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
      }

      const decoded = verifyToken(token)
      console.log('[Controller] Token verification result:', {
        decoded: decoded ? { id: decoded.id, email: decoded.email } : null,
      })

      if (!decoded) {
        console.log('[Controller] Invalid token, returning 401')
        return NextResponse.json({ error: 'トークンが無効です' }, { status: 401 })
      }

      console.log('[Controller] Calling GetUserUseCase with userId:', decoded.id)
      const result = await this.getUserUseCase.execute({ userId: decoded.id })
      console.log('[Controller] UseCase result:', {
        user: { id: result.user.id, email: result.user.email },
      })

      return NextResponse.json({ user: result.user })
    } catch (error) {
      console.error('[Controller] Get user error:', error)

      if (error instanceof Error) {
        if (error.message === 'ユーザーが見つかりません') {
          console.log('[Controller] User not found, returning 404')
          return NextResponse.json({ error: error.message }, { status: 404 })
        }
        if (error.message === 'メールアドレスの確認が必要です') {
          console.log('[Controller] Email not verified, returning 403')
          return NextResponse.json({ error: error.message }, { status: 403 })
        }
      }

      console.log('[Controller] Unexpected error, returning 500')
      return NextResponse.json({ error: 'ユーザー情報の取得に失敗しました' }, { status: 500 })
    }
  }
}
