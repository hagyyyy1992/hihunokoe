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

      // 必須フィールドの確認
      if (!decoded.userId && !decoded.id) {
        throw new Error('Token missing user ID')
      }

      // AuthTokenPayload形式に変換
      return {
        userId: decoded.userId || decoded.id,
        email: decoded.email,
        role: decoded.role || 'USER',
        userName: decoded.userName, // userNameも含める（オプショナル）
      }
    } catch (error) {
      console.error('Token verification error:', error)
      throw new Error('Invalid token')
    }
  }

  generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  async verifyAuthToken(token: string): Promise<string | null> {
    try {
      const payload = await this.verifyToken(token)
      return payload.userId
    } catch (error) {
      return null
    }
  }

  async generatePasswordResetToken(userId: string): Promise<string> {
    // In the existing system, password reset tokens are stored in the database
    // For now, we'll return the userId as the token (to be stored in the database)
    // The actual token generation should be handled by the repository
    return userId
  }

  async verifyPasswordResetToken(token: string): Promise<string | null> {
    // This should verify against the database
    // For now, we'll assume the token is valid if it's a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(token)) {
      return token // Return the userId
    }
    return null
  }

  async invalidatePasswordResetToken(token: string): Promise<void> {
    // This should update the database to invalidate the token
    // Implementation will be handled by the repository
  }

  async generateEmailToken(userId: string): Promise<string> {
    // Generate a unique token for email verification
    return this.generateRandomToken()
  }

  async generateEmailVerificationToken(userId: string): Promise<string> {
    // This is an alias for generateEmailToken for backward compatibility
    return this.generateEmailToken(userId)
  }

  async verifyEmailToken(token: string): Promise<string | null> {
    // This should verify against the database
    // For now, we'll assume the token is valid if it's not empty
    if (token && token.length > 0) {
      return 'mock-user-id' // This should be fetched from the database
    }
    return null
  }

  async invalidateEmailToken(token: string): Promise<void> {
    // This should update the database to invalidate the token
    // Implementation will be handled by the repository
  }
}
