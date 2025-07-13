import { NextRequest, NextResponse } from 'next/server'
import { AdminAuthenticationInteractor } from '@api/use-cases/admin-authentication/interactor'
import { AdminAuthenticationOutputPort } from '@api/use-cases/admin-authentication/output-port'
import { AdminUserRepositoryImpl } from '@api/framework/repositories/AdminUserRepositoryImpl'
import { PasswordHashServiceImpl } from '@api/interface-adapters/services/PasswordHashServiceImpl'
import { TokenServiceImpl } from '@api/interface-adapters/services/TokenServiceImpl'
import { prisma } from '@/lib/prisma'

class AdminAuthPresenter implements AdminAuthenticationOutputPort {
  public result: any = null
  public error: any = null

  presentSuccess(data: {
    adminUser: {
      id: string
      adminName: string
      email: string
      role: string
    }
    token: string
  }): void {
    this.result = data
    this.error = null
  }

  presentError(error: { code: string; message: string }): void {
    this.error = error
    this.result = null
  }
}

export class AdminAuthController {
  private adminUserRepository: AdminUserRepositoryImpl
  private passwordHashService: PasswordHashServiceImpl
  private tokenService: TokenServiceImpl

  constructor() {
    if (!prisma) {
      throw new Error(
        'Database connection is required for admin operations. Please check your database configuration.'
      )
    }

    this.adminUserRepository = new AdminUserRepositoryImpl(prisma)
    this.passwordHashService = new PasswordHashServiceImpl()
    this.tokenService = new TokenServiceImpl()
  }

  async login(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json()
      const { email, password } = body

      if (!email || !password) {
        return NextResponse.json({ error: 'メールアドレスとパスワードが必要です' }, { status: 400 })
      }

      const presenter = new AdminAuthPresenter()
      const interactor = new AdminAuthenticationInteractor(
        this.adminUserRepository,
        this.passwordHashService,
        this.tokenService,
        presenter
      )

      await interactor.login(email, password)

      if (presenter.error) {
        const statusMap: Record<string, number> = {
          INVALID_CREDENTIALS: 401,
          ACCOUNT_LOCKED: 423,
          ACCOUNT_INACTIVE: 403,
          USER_NOT_FOUND: 404,
          INTERNAL_ERROR: 500,
        }
        const status = statusMap[presenter.error.code] || 500
        return NextResponse.json({ error: presenter.error.message }, { status })
      }

      if (!presenter.result) {
        return NextResponse.json({ error: 'ログインに失敗しました' }, { status: 500 })
      }

      const response = NextResponse.json({
        success: true,
        token: presenter.result.token,
        user: presenter.result.adminUser,
      })

      response.cookies.set('admin-auth-token', presenter.result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      })

      return response
    } catch (error) {
      console.error('Admin login error:', error)
      return NextResponse.json({ error: 'ログインに失敗しました' }, { status: 500 })
    }
  }

  async verifyToken(request: NextRequest): Promise<NextResponse> {
    try {
      const authHeader = request.headers.get('Authorization')
      let token = authHeader?.replace('Bearer ', '')

      if (!token) {
        token = request.cookies.get('admin-auth-token')?.value
      }

      if (!token) {
        return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
      }

      const presenter = new AdminAuthPresenter()
      const interactor = new AdminAuthenticationInteractor(
        this.adminUserRepository,
        this.passwordHashService,
        this.tokenService,
        presenter
      )

      await interactor.verifyToken(token)

      if (presenter.error) {
        return NextResponse.json({ error: presenter.error.message }, { status: 401 })
      }

      if (!presenter.result) {
        return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 })
      }

      return NextResponse.json({
        success: true,
        user: presenter.result.adminUser,
      })
    } catch (error) {
      console.error('Token verification error:', error)
      return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 })
    }
  }

  async logout(request: NextRequest): Promise<NextResponse> {
    const response = NextResponse.json({
      success: true,
      message: 'ログアウトしました',
    })

    response.cookies.delete('admin-auth-token')

    return response
  }
}
