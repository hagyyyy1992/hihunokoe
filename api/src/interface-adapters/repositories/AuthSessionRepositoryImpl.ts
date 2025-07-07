import { AuthSession } from '@api/domain/entities/AuthSession'
import { AuthSessionRepository } from '@api/domain/repositories/AuthSessionRepository'
import { randomUUID } from 'crypto'

interface StoredSession {
  session: AuthSession
  isValid: boolean
}

export class AuthSessionRepositoryImpl implements AuthSessionRepository {
  private sessions: Map<string, StoredSession> = new Map()

  async create(session: AuthSession): Promise<void> {
    const sessionWithId = new AuthSession(
      session.id || randomUUID(),
      session.userId,
      session.token,
      session.expiresAt,
      session.createdAt
    )
    this.sessions.set(session.token, {
      session: sessionWithId,
      isValid: true,
    })
  }

  async findByToken(token: string): Promise<AuthSession | null> {
    const sessionData = this.sessions.get(token)
    if (!sessionData || !sessionData.isValid) return null

    const session = sessionData.session

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

    this.sessions.forEach((sessionData, token) => {
      if (sessionData.session.userId === userId) {
        tokensToDelete.push(token)
      }
    })

    tokensToDelete.forEach(token => this.sessions.delete(token))
  }

  async deleteExpiredSessions(): Promise<void> {
    const tokensToDelete: string[] = []

    this.sessions.forEach((sessionData, token) => {
      if (sessionData.session.isExpired()) {
        tokensToDelete.push(token)
      }
    })

    tokensToDelete.forEach(token => this.sessions.delete(token))
  }

  async findById(id: string): Promise<AuthSession | null> {
    for (const sessionData of this.sessions.values()) {
      if (sessionData.session.id === id) {
        if (sessionData.session.isExpired()) {
          this.sessions.delete(sessionData.session.token)
          return null
        }
        return sessionData.session
      }
    }
    return null
  }

  async invalidate(id: string): Promise<void> {
    for (const [token, sessionData] of this.sessions.entries()) {
      if (sessionData.session.id === id) {
        sessionData.isValid = false
        this.sessions.set(token, sessionData)
        break
      }
    }
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    for (const [token, sessionData] of this.sessions.entries()) {
      if (sessionData.session.userId === userId) {
        sessionData.isValid = false
        this.sessions.set(token, sessionData)
      }
    }
  }
}
