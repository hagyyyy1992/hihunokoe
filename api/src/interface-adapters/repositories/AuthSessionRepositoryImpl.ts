import { AuthSession } from '@api/domain/entities/AuthSession'
import { AuthSessionRepository } from '@api/domain/repositories/AuthSessionRepository'

export class AuthSessionRepositoryImpl implements AuthSessionRepository {
  private sessions: Map<string, AuthSession> = new Map()

  async create(session: AuthSession): Promise<void> {
    this.sessions.set(session.token, session)
  }

  async findByToken(token: string): Promise<AuthSession | null> {
    const session = this.sessions.get(token)
    if (!session) return null

    if (session.isExpired()) {
      this.sessions.delete(token)
      return null
    }

    return session
  }

  async deleteByToken(token: string): Promise<void> {
    this.sessions.delete(token)
  }

  async deleteByUserId(userId: string): Promise<void> {
    const tokensToDelete: string[] = []

    this.sessions.forEach((session, token) => {
      if (session.userId === userId) {
        tokensToDelete.push(token)
      }
    })

    tokensToDelete.forEach(token => this.sessions.delete(token))
  }

  async deleteExpiredSessions(): Promise<void> {
    const tokensToDelete: string[] = []

    this.sessions.forEach((session, token) => {
      if (session.isExpired()) {
        tokensToDelete.push(token)
      }
    })

    tokensToDelete.forEach(token => this.sessions.delete(token))
  }
}
