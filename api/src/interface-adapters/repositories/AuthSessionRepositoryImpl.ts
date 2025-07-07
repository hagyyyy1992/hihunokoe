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

  async findById(id: string): Promise<AuthSession | null> {
    for (const session of this.sessions.values()) {
      if (session.id === id) {
        if (session.isExpired()) {
          this.sessions.delete(session.token)
          return null
        }
        return session
      }
    }
    return null
  }

  async invalidate(id: string): Promise<void> {
    for (const [token, session] of this.sessions.entries()) {
      if (session.id === id) {
        session.isValid = false
        this.sessions.set(token, session)
        break
      }
    }
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    for (const [token, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        session.isValid = false
        this.sessions.set(token, session)
      }
    }
  }
}
