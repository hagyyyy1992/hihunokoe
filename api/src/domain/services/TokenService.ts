import { AuthTokenPayload } from '@api/domain/entities/AuthSession'

export interface ITokenService {
  generateToken(payload: AuthTokenPayload): Promise<string>
  verifyToken(token: string): Promise<AuthTokenPayload>
  generateRandomToken(): string

  // Auth token methods
  verifyAuthToken(token: string): Promise<string | null>

  // Password reset token methods
  generatePasswordResetToken(userId: string): Promise<string>
  verifyPasswordResetToken(token: string): Promise<string | null>
  invalidatePasswordResetToken(token: string): Promise<void>

  // Email verification token methods
  generateEmailToken(userId: string): Promise<string>
  generateEmailVerificationToken(userId: string): Promise<string>
  verifyEmailToken(token: string): Promise<string | null>
  invalidateEmailToken(token: string): Promise<void>
}
