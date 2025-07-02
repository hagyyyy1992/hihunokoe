import { TokenService } from '@api/domain/services/TokenService'
import { AuthTokenPayload } from '@api/domain/entities/AuthSession'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

export class TokenServiceImpl implements TokenService {
  private readonly jwtSecret: string

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key'
  }

  async generateToken(payload: AuthTokenPayload): Promise<string> {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: '24h',
    })
  }

  async verifyToken(token: string): Promise<AuthTokenPayload> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as AuthTokenPayload
      return decoded
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }
}
