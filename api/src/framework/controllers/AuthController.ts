import { NextRequest, NextResponse } from 'next/server'
import { LoginUseCase } from '@api/usecases/auth/LoginUseCase'
import { RegisterUseCase } from '@api/usecases/auth/RegisterUseCase'
import { ForgotPasswordUseCase } from '@api/usecases/auth/ForgotPasswordUseCase'
import { ResetPasswordUseCase } from '@api/usecases/auth/ResetPasswordUseCase'
import { VerifyEmailUseCase } from '@api/usecases/auth/VerifyEmailUseCase'
import { LogoutUseCase } from '@api/usecases/auth/LogoutUseCase'
import { GetCurrentUserUseCase } from '@api/usecases/auth/GetCurrentUserUseCase'
import { DeleteAccountUseCase } from '@api/usecases/auth/DeleteAccountUseCase'
import { ResendVerificationEmailUseCase } from '@api/usecases/auth/ResendVerificationEmailUseCase'
import { VerifyPasswordResetTokenUseCase } from '@api/usecases/auth/VerifyPasswordResetTokenUseCase'
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
} from '@api/domain/exceptions/AuthenticationError'

export class AuthController {
  private userRepository: UserRepositoryImpl
  private authSessionRepository: AuthSessionRepositoryImpl
  private passwordHashService: PasswordHashServiceImpl
  private tokenService: TokenServiceImpl
  private emailService: EmailServiceImpl

  constructor() {
    this.userRepository = new UserRepositoryImpl()
    this.authSessionRepository = new AuthSessionRepositoryImpl()
    this.passwordHashService = new PasswordHashServiceImpl()
    this.tokenService = new TokenServiceImpl()
    this.emailService = new EmailServiceImpl()
  }

  async login(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json()
      const { email, password } = body

      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
      }

      const loginUseCase = new LoginUseCase(
        this.userRepository,
        this.authSessionRepository,
        this.passwordHashService,
        this.tokenService
      )

      const result = await loginUseCase.execute({ email, password })

      return NextResponse.json({
        success: true,
        token: result.token,
        user: result.user,
      })
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        // カスタムメッセージがある場合はそれを使用
        const message = error.message || 'メールアドレスまたはパスワードが間違っています'
        return NextResponse.json({ error: message }, { status: 401 })
      }
      if (error instanceof AccountLockedError) {
        return NextResponse.json(
          { error: 'ログイン試行回数が多すぎるため、アカウントがロックされています' },
          { status: 423 }
        )
      }
      if (error instanceof AccountInactiveError) {
        return NextResponse.json({ error: 'アカウントが無効です' }, { status: 403 })
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
      return NextResponse.json({ error: 'ログインに失敗しました' }, { status: 500 })
    }
  }

  async register(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json()
      const { email, username, password } = body

      if (!email || !username || !password) {
        return NextResponse.json(
          { error: 'Email, username, and password are required' },
          { status: 400 }
        )
      }

      const registerUseCase = new RegisterUseCase(
        this.userRepository,
        this.passwordHashService,
        this.tokenService
      )

      const result = await registerUseCase.execute({ email, username, password })

      return NextResponse.json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        userId: result.id,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Email already exists') {
          return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
        }
        if (error.message === 'Username already exists') {
          return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
        }
        if (error.message.includes('Invalid email format')) {
          return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
        }
        if (error.message.includes('Password must be')) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
      }

      console.error('Registration error:', error)
      return NextResponse.json({ error: 'An error occurred during registration' }, { status: 500 })
    }
  }

  async forgotPassword(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json()
      const { email } = body

      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 })
      }

      const forgotPasswordUseCase = new ForgotPasswordUseCase(
        this.userRepository,
        this.emailService,
        this.tokenService
      )

      const result = await forgotPasswordUseCase.execute({ email })

      return NextResponse.json({
        success: result.success,
        message: result.message,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid email format') {
          return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
        }
      }

      console.error('Forgot password error:', error)
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
        return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
      }

      const resetPasswordUseCase = new ResetPasswordUseCase(
        this.userRepository,
        this.passwordHashService,
        this.tokenService
      )

      const result = await resetPasswordUseCase.execute({ token, password })

      return NextResponse.json({
        success: result.success,
        message: result.message,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid or expired reset token') {
          return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
        }
        if (error.message.includes('Password must be')) {
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
      const body = await request.json()
      const { token } = body

      if (!token) {
        return NextResponse.json({ error: 'Token is required' }, { status: 400 })
      }

      const verifyEmailUseCase = new VerifyEmailUseCase(this.userRepository, this.tokenService)

      const result = await verifyEmailUseCase.execute({ token })

      return NextResponse.json({
        success: result.success,
        message: result.message,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid or expired verification token') {
          return NextResponse.json(
            { error: 'Invalid or expired verification token' },
            { status: 400 }
          )
        }
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

      const logoutUseCase = new LogoutUseCase(this.authSessionRepository)

      const result = await logoutUseCase.execute({ token })

      return NextResponse.json({
        success: result.success,
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

      if (!token) {
        return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 })
      }

      const getCurrentUserUseCase = new GetCurrentUserUseCase(
        this.userRepository,
        this.authSessionRepository,
        this.tokenService
      )

      const result = await getCurrentUserUseCase.execute({ token })

      return NextResponse.json({
        success: true,
        user: result.user,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid or expired token' || error.message === 'Session expired') {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (error.message === 'User not found' || error.message === 'Account is inactive') {
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
      }

      console.error('Get current user error:', error)
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

      const deleteAccountUseCase = new DeleteAccountUseCase(
        this.userRepository,
        this.passwordHashService,
        this.authSessionRepository,
        this.tokenService
      )

      const result = await deleteAccountUseCase.execute({ token, password })

      return NextResponse.json({
        success: result.success,
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

      // リクエストから動的にベースURLを取得
      const host = request.headers.get('host')
      const protocol = request.headers.get('x-forwarded-proto') || 'http'
      const baseUrl = host ? `${protocol}://${host}` : undefined

      const resendVerificationUseCase = new ResendVerificationEmailUseCase(
        this.userRepository,
        this.emailService,
        this.tokenService
      )

      const result = await resendVerificationUseCase.execute({ email, baseUrl })

      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 })
      }

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

      const verifyTokenUseCase = new VerifyPasswordResetTokenUseCase(
        this.userRepository,
        this.tokenService
      )

      const result = await verifyTokenUseCase.execute({ token })

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: result.message,
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            message: result.message,
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
