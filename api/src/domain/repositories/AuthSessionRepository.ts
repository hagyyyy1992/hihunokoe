import { AuthSession } from '@api/domain/entities/AuthSession'

export interface AuthSessionRepository {
  create(session: AuthSession): Promise<void>
  findByToken(token: string): Promise<AuthSession | null>
  deleteByToken(token: string): Promise<void>
  deleteByUserId(userId: string): Promise<void>
  deleteExpiredSessions(): Promise<void>
}
