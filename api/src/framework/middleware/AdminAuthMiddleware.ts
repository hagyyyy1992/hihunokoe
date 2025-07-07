import { NextRequest, NextResponse } from 'next/server'
import { VerifyTokenUseCase } from '@api/usecases/auth/VerifyTokenUseCase'
import { UserRepositoryImpl } from '@api/interface-adapters/repositories/UserRepositoryImpl'
import { TokenServiceImpl } from '@api/interface-adapters/services/TokenServiceImpl'
import { User } from '@api/domain/entities/User'

export interface AuthenticatedRequest extends NextRequest {
  user?: User
}

export class AdminAuthMiddleware {
  private userRepository: UserRepositoryImpl
  private tokenService: TokenServiceImpl

  constructor() {
    this.userRepository = new UserRepositoryImpl()
    this.tokenService = new TokenServiceImpl()
  }

  async authenticate(
    request: NextRequest
  ): Promise<{ user: User | null; response?: NextResponse }> {
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
      const verifyTokenUseCase = new VerifyTokenUseCase(this.userRepository, this.tokenService)
      const { user, isValid } = await verifyTokenUseCase.execute({ token })

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

      return { user }
    } catch (error) {
      console.error('Admin auth middleware error:', error)
      return {
        user: null,
        response: NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
      }
    }
  }

  isAdmin(user: User): boolean {
    return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
  }

  isSuperAdmin(user: User): boolean {
    return user.role === 'SUPER_ADMIN'
  }
}
