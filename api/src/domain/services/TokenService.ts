import { AuthTokenPayload } from '@api/domain/entities/AuthSession'

export interface TokenService {
  generateToken(payload: AuthTokenPayload): Promise<string>
  verifyToken(token: string): Promise<AuthTokenPayload>
  generateRandomToken(): string
}
