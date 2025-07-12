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
      userName: payload.userName,
      termsAcceptedAt: payload.termsAcceptedAt,
      privacyAcceptedAt: payload.privacyAcceptedAt,
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
        termsAcceptedAt: decoded.termsAcceptedAt,
        privacyAcceptedAt: decoded.privacyAcceptedAt,
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
    // Generate a random token for password reset
    const token = this.generateRandomToken()

    // Note: The token should be saved to the database by the use case
    // This service only generates the token
    return token
  }

  async verifyPasswordResetToken(token: string): Promise<string | null> {
    // This should verify against the database
    // The actual verification should be done in the use case
    // This method is just a placeholder for token format validation
    if (token && token.length > 0) {
      // Return a non-null value to indicate the token format is valid
      // The actual user lookup will be done in the use case
      return 'valid'
    }
    return null
  }

  async invalidatePasswordResetToken(token: string): Promise<void> {
    // This should update the database to invalidate the token
    // Implementation will be handled by the repository
  }

  async generateEmailToken(userId: string): Promise<string> {
    // Generate a unique token for email verification
    const token = this.generateRandomToken()

    // Update user with new token - this should be done in the use case
    // The token generation should be pure, database update is a side effect
    return token
  }

  async generateEmailVerificationToken(userId: string): Promise<string> {
    // This is an alias for generateEmailToken for backward compatibility
    return this.generateEmailToken(userId)
  }

  async verifyEmailToken(token: string): Promise<string | null> {
    // This should verify against the database
    // For now, return null to indicate that the token verification should be done elsewhere
    // The actual implementation should be in the repository layer
    return null
  }

  async invalidateEmailToken(token: string): Promise<void> {
    // This should update the database to invalidate the token
    // Implementation will be handled by the repository
  }
}
