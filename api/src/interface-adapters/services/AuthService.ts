import { NextRequest } from 'next/server'
import { IAuthService } from '@api/domain/services/AuthService'
import { ITokenService } from '@api/domain/services/TokenService'
import { ApplicationError } from '@api/framework/errors/ApplicationError'

export class AuthServiceImpl implements IAuthService {
  constructor(private tokenService: ITokenService) {}

  async getUserIdFromRequest(request: NextRequest): Promise<string | null> {
    // Bearerトークンからの認証
    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      try {
        const decoded = await this.tokenService.verifyToken(token)
        return decoded.userId
      } catch {
        return null
      }
    }

    // Cookieからの認証
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim())
      const authCookie = cookies.find(c => c.startsWith('auth-token='))
      if (authCookie) {
        const token = authCookie.split('=')[1]
        try {
          const decoded = await this.tokenService.verifyToken(token)
          return decoded.userId
        } catch {
          return null
        }
      }
    }

    return null
  }

  async requireAuth(request: NextRequest): Promise<string> {
    const userId = await this.getUserIdFromRequest(request)
    if (!userId) {
      throw ApplicationError.unauthorized()
    }
    return userId
  }
}
