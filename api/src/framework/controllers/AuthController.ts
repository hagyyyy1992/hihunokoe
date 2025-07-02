import { NextRequest, NextResponse } from 'next/server'
import { LoginUseCase } from '@api/usecases/auth/LoginUseCase'
import { RegisterUseCase } from '@api/usecases/auth/RegisterUseCase'
import { UserRepositoryImpl } from '@api/interface-adapters/repositories/UserRepositoryImpl'
import { AuthSessionRepositoryImpl } from '@api/interface-adapters/repositories/AuthSessionRepositoryImpl'
import { PasswordHashServiceImpl } from '@api/interface-adapters/services/PasswordHashServiceImpl'
import { TokenServiceImpl } from '@api/interface-adapters/services/TokenServiceImpl'
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

  constructor() {
    this.userRepository = new UserRepositoryImpl()
    this.authSessionRepository = new AuthSessionRepositoryImpl()
    this.passwordHashService = new PasswordHashServiceImpl()
    this.tokenService = new TokenServiceImpl()
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
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }
      if (error instanceof AccountLockedError) {
        return NextResponse.json(
          { error: 'Account is locked due to too many failed login attempts' },
          { status: 423 }
        )
      }
      if (error instanceof AccountInactiveError) {
        return NextResponse.json({ error: 'Account is inactive' }, { status: 403 })
      }
      if (error instanceof EmailNotVerifiedError) {
        return NextResponse.json(
          { error: 'Please verify your email before logging in' },
          { status: 403 }
        )
      }

      console.error('Login error:', error)
      return NextResponse.json({ error: 'An error occurred during login' }, { status: 500 })
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
}
