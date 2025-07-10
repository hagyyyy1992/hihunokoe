import { NextRequest, NextResponse } from 'next/server'
import { AuthenticationUseCase } from '@api/usecases/auth/interactor'
import type { VerifyTokenInputPort } from '@api/usecases/auth/input-port'
import { UserRepository } from '@api/interface-adapters/repositories/User.repository'
import { AuthSessionRepository } from '@api/interface-adapters/repositories/AuthSession.repository'
import { PasswordHashServiceImpl } from '@api/interface-adapters/services/PasswordHashServiceImpl'
import { TokenServiceImpl } from '@api/interface-adapters/services/TokenServiceImpl'
import { User } from '@api/domain/entities/User'

export interface AuthenticatedRequest extends NextRequest {
  user?: { id: string; email: string; userName: string; role: string; emailVerified: boolean }
}

export class AdminAuthMiddleware {
  private authenticationUseCase: AuthenticationUseCase
  private tokenService: TokenServiceImpl

  constructor() {
    const userRepository = new UserRepository()
    const authSessionRepository = new AuthSessionRepository()
    const passwordHashService = new PasswordHashServiceImpl()
    this.tokenService = new TokenServiceImpl()

    this.authenticationUseCase = new AuthenticationUseCase(
      userRepository,
      authSessionRepository,
      passwordHashService,
      this.tokenService
    )
  }

  async authenticate(request: NextRequest): Promise<{
    user: {
      id: string
      email: string
      userName: string
      role: string
      emailVerified: boolean
    } | null
    response?: NextResponse
  }> {
    try {
      // Get token from Authorization header
      const authHeader = request.headers.get('Authorization')
      const cookieHeader = request.headers.get('cookie')

      let token: string | null = null

      // Try Authorization header first
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
      // Fallback to cookie
      else if (cookieHeader) {
        const cookies = cookieHeader.split(';').map(c => c.trim())
        const adminAuthCookie = cookies.find(c => c.startsWith('admin-auth='))
        if (adminAuthCookie) {
          token = adminAuthCookie.split('=')[1]
        }
      }

      if (!token) {
        return {
          user: null,
          response: NextResponse.json(
            { error: 'Unauthorized - No token provided' },
            { status: 401 }
          ),
        }
      }

      // Verify token
      const input: VerifyTokenInputPort = { token }
      const { user, isValid } = await this.authenticationUseCase.verifyToken(input)

      if (!isValid || !user) {
        return {
          user: null,
          response: NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 }),
        }
      }

      // Check if user is admin
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return {
          user: null,
          response: NextResponse.json(
            { error: 'Forbidden - Admin access required' },
            { status: 403 }
          ),
        }
      }

      return {
        user: user as {
          id: string
          email: string
          userName: string
          role: string
          emailVerified: boolean
        },
      }
    } catch (error) {
      console.error('Admin auth middleware error:', error)
      return {
        user: null,
        response: NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
      }
    }
  }

  isAdmin(user: { role: string }): boolean {
    return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
  }

  isSuperAdmin(user: { role: string }): boolean {
    return user.role === 'SUPER_ADMIN'
  }
}
