import { NextRequest, NextResponse } from 'next/server'
import {
  AuthenticationUseCase,
  PasswordManagementUseCase,
  EmailVerificationUseCase,
  AccountManagementUseCase,
} from '@api/usecases/auth/interactor'
import type {
  LoginInputPort,
  RegisterInputPort,
  ForgotPasswordInputPort,
  ResetPasswordInputPort,
  VerifyEmailInputPort,
  LogoutInputPort,
  GetCurrentUserInputPort,
  DeleteAccountInputPort,
  ResendVerificationEmailInputPort,
  VerifyPasswordResetTokenInputPort,
  VerifyTokenInputPort,
} from '@api/usecases/auth/input-port'
import { UserRepositoryImpl } from '@api/interface-adapters/repositories/UserRepositoryImpl'
import { AuthSessionRepositoryImpl } from '@api/interface-adapters/repositories/AuthSessionRepositoryImpl'
import { PasswordHashServiceImpl } from '@api/interface-adapters/services/PasswordHashServiceImpl'
import { TokenServiceImpl } from '@api/interface-adapters/services/TokenServiceImpl'
import { EmailServiceImpl } from '@api/interface-adapters/services/EmailServiceImpl'
import {
  InvalidCredentialsError,
  AccountLockedError,
  AccountInactiveError,
  EmailNotVerifiedError,
  InvalidTokenError,
  TokenExpiredError,
} from '@api/domain/exceptions/AuthenticationError'

export class AuthController {
  private authenticationUseCase: AuthenticationUseCase
  private passwordManagementUseCase: PasswordManagementUseCase
  private emailVerificationUseCase: EmailVerificationUseCase
  private accountManagementUseCase: AccountManagementUseCase
  private emailService: EmailServiceImpl

  constructor() {
    const userRepository = new UserRepositoryImpl()
    const authSessionRepository = new AuthSessionRepositoryImpl()
    const passwordHashService = new PasswordHashServiceImpl()
    const tokenService = new TokenServiceImpl()
    const emailService = new EmailServiceImpl()

    this.authenticationUseCase = new AuthenticationUseCase(
      userRepository,
      authSessionRepository,
      passwordHashService,
      tokenService
    )
    this.passwordManagementUseCase = new PasswordManagementUseCase(
      userRepository,
      passwordHashService,
      tokenService,
      emailService
    )
    this.emailVerificationUseCase = new EmailVerificationUseCase(
      userRepository,
      tokenService,
      emailService
    )
    this.accountManagementUseCase = new AccountManagementUseCase(
      userRepository,
      authSessionRepository,
      passwordHashService
    )
    this.emailService = emailService
  }

  async login(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json()
      const { email, password } = body

      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
      }

      const inputPort: LoginInputPort = { email, password }
      const result = await this.authenticationUseCase.login(inputPort)

      return NextResponse.json(
        {
          success: true,
          token: result.token,
          user: result.user,
        },
        { status: 200 }
      )
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error instanceof AccountLockedError) {
        return NextResponse.json({ error: error.message }, { status: 423 })
      }
      if (error instanceof AccountInactiveError) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      if (error instanceof EmailNotVerifiedError) {
        return NextResponse.json(
          {
            error: 'メールアドレスの確認が完了していません。確認メールをご確認ください。',
            emailVerificationRequired: true,
          },
          { status: 403 }
        )
      }

      console.error('Login error:', error)
      return NextResponse.json({ error: 'ログイン中にエラーが発生しました' }, { status: 500 })
    }
  }

  async register(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json()
      const { email, userName, password } = body

      if (!email || !userName || !password) {
        return NextResponse.json(
          { error: 'メールアドレス、ユーザー名、パスワードは必須です' },
          { status: 400 }
        )
      }

      const inputPort: RegisterInputPort = { email, userName, password }
      const result = await this.authenticationUseCase.register(inputPort)

      // Send verification email after successful registration
      if (this.emailService && result.user.emailVerificationToken) {
        const baseUrl =
          process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        await this.emailService.sendVerificationEmail(
          result.user.email,
          result.user.username,
          result.user.emailVerificationToken,
          baseUrl
        )
      }

      return NextResponse.json({
        success: true,
        message:
          result.message ||
          'アカウントが作成されました。メールアドレスを確認してアカウントを有効化してください。',
        userId: result.user.id,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'ユーザー名またはメールアドレスが既に使用されています') {
          return NextResponse.json({ error: error.message }, { status: 409 })
        }
        if (error.message.includes('このメールアドレスは既に登録されています')) {
          return NextResponse.json({ error: error.message }, { status: 409 })
        }
        if (error.message.includes('このユーザー名は既に使用されています')) {
          return NextResponse.json({ error: error.message }, { status: 409 })
        }
        if (error.message.includes('無効なメールアドレス形式です')) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        if (error.message.includes('パスワードは8文字以上で入力してください')) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
      }

      console.error('Registration error:', error)
      return NextResponse.json({ error: '登録処理中にエラーが発生しました' }, { status: 500 })
    }
  }

  async forgotPassword(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json()
      const { email } = body

      if (!email) {
        return NextResponse.json({ error: 'メールアドレスは必須です' }, { status: 400 })
      }

      const inputPort: ForgotPasswordInputPort = { email }
      const result = await this.passwordManagementUseCase.forgotPassword(inputPort)

      return NextResponse.json({
        success: true,
        message: result.message,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === '無効なメールアドレス形式です') {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
      }

      console.error('Forgot password error:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      return NextResponse.json(
        { error: 'パスワードリセットの処理中にエラーが発生しました' },
        { status: 500 }
      )
    }
  }

  async resetPassword(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json()
      const { token, password } = body

      if (!token || !password) {
        return NextResponse.json({ error: 'トークンとパスワードは必須です' }, { status: 400 })
      }

      const inputPort: ResetPasswordInputPort = { token, newPassword: password }
      const result = await this.passwordManagementUseCase.resetPassword(inputPort)

      return NextResponse.json({
        success: true,
        message: result.message,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid or expired reset token') {
          return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
        }
        if (error.message.includes('パスワードは8文字以上で入力してください')) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        if (error.message === 'User not found' || error.message === 'Account is inactive') {
          return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }
      }

      console.error('Reset password error:', error)
      return NextResponse.json(
        { error: 'パスワードリセットの処理中にエラーが発生しました' },
        { status: 500 }
      )
    }
  }

  async verifyEmail(request: NextRequest): Promise<NextResponse> {
    try {
      // Handle both GET (query params) and POST (body) requests
      let token: string | null = null

      if (request.method === 'GET') {
        const { searchParams } = new URL(request.url)
        token = searchParams.get('token')
      } else {
        const body = await request.json()
        token = body.token
      }

      if (!token) {
        return NextResponse.json({ error: 'トークンは必須です' }, { status: 400 })
      }

      const inputPort: VerifyEmailInputPort = { token }
      const result = await this.emailVerificationUseCase.verifyEmail(inputPort)

      return NextResponse.json({
        success: true,
        message: result.message,
      })
    } catch (error) {
      if (error instanceof InvalidTokenError) {
        return NextResponse.json(
          { error: 'Invalid or expired verification token' },
          { status: 400 }
        )
      }
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }
      }

      console.error('Verify email error:', error)
      return NextResponse.json(
        { error: 'メール認証の処理中にエラーが発生しました' },
        { status: 500 }
      )
    }
  }

  async logout(request: NextRequest): Promise<NextResponse> {
    try {
      const authHeader = request.headers.get('Authorization')
      const token = authHeader?.replace('Bearer ', '')

      if (!token) {
        return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 })
      }

      const inputPort: LogoutInputPort = { token }
      const result = await this.authenticationUseCase.logout(inputPort)

      return NextResponse.json({
        success: true,
        message: result.message,
      })
    } catch (error) {
      console.error('Logout error:', error)
      return NextResponse.json({ error: 'An error occurred during logout' }, { status: 500 })
    }
  }

  async getCurrentUser(request: NextRequest): Promise<NextResponse> {
    try {
      const authHeader = request.headers.get('Authorization')
      const token = authHeader?.replace('Bearer ', '')

      // デバッグログ
      console.log(
        '[AuthController.getCurrentUser] Authorization header:',
        authHeader ? authHeader.substring(0, 30) + '...' : 'null'
      )
      console.log(
        '[AuthController.getCurrentUser] Token extracted:',
        token ? token.substring(0, 20) + '...' : 'null'
      )

      if (!token) {
        return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 })
      }

      const inputPort: GetCurrentUserInputPort = { token }
      const result = await this.authenticationUseCase.getCurrentUser(inputPort)

      return NextResponse.json({
        success: true,
        user: result.user,
      })
    } catch (error) {
      console.error('[AuthController.getCurrentUser] Error:', error)
      console.error('[AuthController.getCurrentUser] Error type:', error?.constructor?.name)
      console.error(
        '[AuthController.getCurrentUser] Error message:',
        error instanceof Error ? error.message : 'Unknown error'
      )

      if (error instanceof InvalidTokenError || error instanceof TokenExpiredError) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error instanceof Error) {
        if (error.message === 'User not found' || error.message === 'Account is inactive') {
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
      }

      return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
    }
  }

  async deleteAccount(request: NextRequest): Promise<NextResponse> {
    try {
      const authHeader = request.headers.get('Authorization')
      const token = authHeader?.replace('Bearer ', '')

      if (!token) {
        return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 })
      }

      const body = await request.json()
      const { password } = body

      if (!password) {
        return NextResponse.json({ error: 'Password is required' }, { status: 400 })
      }

      // First verify the token and get user info
      const tokenService = new TokenServiceImpl()
      const decoded = await tokenService.verifyToken(token)

      const inputPort: DeleteAccountInputPort = { userId: decoded.userId, password }
      const result = await this.accountManagementUseCase.deleteAccount(inputPort)

      return NextResponse.json({
        success: true,
        message: result.message,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid or expired token') {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (error.message === 'Invalid password') {
          return NextResponse.json({ error: 'Invalid password' }, { status: 400 })
        }
        if (error.message === 'User not found') {
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
      }

      console.error('Delete account error:', error)
      return NextResponse.json(
        { error: 'An error occurred while deleting account' },
        { status: 500 }
      )
    }
  }

  async resendVerificationEmail(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json()
      const { email } = body

      if (!email || !email.includes('@')) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        )
      }

      const inputPort: ResendVerificationEmailInputPort = { email }
      const result = await this.emailVerificationUseCase.resendVerificationEmail(inputPort)

      return NextResponse.json({ message: result.message })
    } catch (error) {
      console.error('Resend verification email error:', error)
      return NextResponse.json({ error: '確認メールの再送信に失敗しました' }, { status: 500 })
    }
  }

  async verifyPasswordResetToken(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json()
      const { token } = body

      if (!token || token.trim() === '') {
        return NextResponse.json({ success: false, message: 'トークンが必要です' }, { status: 400 })
      }

      const inputPort: VerifyPasswordResetTokenInputPort = { token }
      const result = await this.passwordManagementUseCase.verifyPasswordResetToken(inputPort)

      if (result.isValid) {
        return NextResponse.json({
          success: true,
          message: 'トークンは有効です',
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            message: 'トークンが無効です',
          },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Token verification error:', error)
      return NextResponse.json(
        { success: false, message: 'トークンの確認中にエラーが発生しました' },
        { status: 500 }
      )
    }
  }
}
