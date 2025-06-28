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
    try {
      const token = request.cookies.get('auth-token')?.value

      if (!token) {
        return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
      }

      const decoded = verifyToken(token)

      if (!decoded) {
        return NextResponse.json({ error: 'トークンが無効です' }, { status: 401 })
      }

      const result = await this.getUserUseCase.execute({ userId: decoded.id })

      return NextResponse.json({ user: result.user })
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
