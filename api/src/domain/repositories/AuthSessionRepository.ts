import { AuthSession } from '@api/domain/entities/AuthSession'

export interface IAuthSessionRepository {
  create(session: AuthSession): Promise<void>
  findByToken(token: string): Promise<AuthSession | null>
  findById(id: string): Promise<AuthSession | null>
  deleteByToken(token: string): Promise<void>
  deleteByUserId(userId: string): Promise<void>
  deleteExpiredSessions(): Promise<void>
  invalidate(id: string): Promise<void>
  invalidateAllUserSessions(userId: string): Promise<void>
}
