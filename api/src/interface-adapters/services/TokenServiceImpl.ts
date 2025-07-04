import { TokenService } from '@api/domain/services/TokenService'
import { AuthTokenPayload } from '@api/domain/entities/AuthSession'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

export class TokenServiceImpl implements TokenService {
  private readonly jwtSecret: string

  constructor() {
    this.jwtSecret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'your-secret-key'
  }

  async generateToken(payload: AuthTokenPayload): Promise<string> {
    // レガシーシステムとの互換性のため、userIdをidにもマッピング
    const tokenPayload = {
      id: payload.userId, // レガシー互換性
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    }

    return jwt.sign(tokenPayload, this.jwtSecret, {
      expiresIn: '7d', // auth.tsと同じ7日間に統一
    })
  }

  async verifyToken(token: string): Promise<AuthTokenPayload> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any

      // レガシーシステムとの互換性のため、idフィールドをuserIdにマッピング
      if (decoded.id && !decoded.userId) {
        decoded.userId = decoded.id
      }

      // AuthTokenPayload形式に変換
      return {
        userId: decoded.userId || decoded.id,
        email: decoded.email,
        role: decoded.role || 'USER',
      }
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }
}
