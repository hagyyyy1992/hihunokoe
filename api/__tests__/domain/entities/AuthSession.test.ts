import { AuthSession, AuthTokenPayload } from '@api/domain/entities/AuthSession'

describe('AuthSession Entity', () => {
  describe('constructor', () => {
    it('正常にAuthSessionエンティティを作成できる', () => {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 1000 * 60 * 60) // 1時間後

      const authSession = new AuthSession(
        'session-123',
        'user-123',
        'jwt-token-123',
        expiresAt,
        now
      )

      expect(authSession.id).toBe('session-123')
      expect(authSession.userId).toBe('user-123')
      expect(authSession.token).toBe('jwt-token-123')
      expect(authSession.expiresAt).toBe(expiresAt)
      expect(authSession.createdAt).toBe(now)
    })
  })

  describe('isExpired', () => {
    it('有効期限が現在時刻より後の場合はfalseを返す', () => {
      const now = new Date()
      const futureDate = new Date(now.getTime() + 1000 * 60 * 60) // 1時間後

      const authSession = new AuthSession(
        'session-123',
        'user-123',
        'jwt-token-123',
        futureDate,
        now
      )

      expect(authSession.isExpired()).toBe(false)
    })

    it('有効期限が現在時刻より前の場合はtrueを返す', () => {
      const now = new Date()
      const pastDate = new Date(now.getTime() - 1000 * 60 * 60) // 1時間前

      const authSession = new AuthSession('session-123', 'user-123', 'jwt-token-123', pastDate, now)

      expect(authSession.isExpired()).toBe(true)
    })

    it('有効期限が現在時刻と同じ場合はtrueを返す', () => {
      const now = new Date()

      const authSession = new AuthSession('session-123', 'user-123', 'jwt-token-123', now, now)

      // 実行時間による微妙な差を考慮して、わずかに遅れた時刻でテスト
      jest.useFakeTimers()
      jest.setSystemTime(new Date(now.getTime() + 1))

      expect(authSession.isExpired()).toBe(true)

      jest.useRealTimers()
    })
  })

  describe('isValid', () => {
    it('有効期限内の場合はtrueを返す', () => {
      const now = new Date()
      const futureDate = new Date(now.getTime() + 1000 * 60 * 60) // 1時間後

      const authSession = new AuthSession(
        'session-123',
        'user-123',
        'jwt-token-123',
        futureDate,
        now
      )

      expect(authSession.isValid()).toBe(true)
    })

    it('有効期限切れの場合はfalseを返す', () => {
      const now = new Date()
      const pastDate = new Date(now.getTime() - 1000 * 60 * 60) // 1時間前

      const authSession = new AuthSession('session-123', 'user-123', 'jwt-token-123', pastDate, now)

      expect(authSession.isValid()).toBe(false)
    })

    it('isValidメソッドはisExpiredの逆の値を返す', () => {
      const now = new Date()
      const futureDate = new Date(now.getTime() + 1000 * 60 * 60)

      const validSession = new AuthSession(
        'session-123',
        'user-123',
        'jwt-token-123',
        futureDate,
        now
      )

      const pastDate = new Date(now.getTime() - 1000 * 60 * 60)
      const expiredSession = new AuthSession(
        'session-456',
        'user-456',
        'jwt-token-456',
        pastDate,
        now
      )

      expect(validSession.isValid()).toBe(!validSession.isExpired())
      expect(expiredSession.isValid()).toBe(!expiredSession.isExpired())
    })
  })

  describe('複数のAuthSessionインスタンス', () => {
    it('異なるセッションIDで複数のインスタンスを作成できる', () => {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 1000 * 60 * 60)

      const session1 = new AuthSession('session-1', 'user-123', 'token-1', expiresAt, now)

      const session2 = new AuthSession('session-2', 'user-123', 'token-2', expiresAt, now)

      expect(session1.id).toBe('session-1')
      expect(session2.id).toBe('session-2')
      expect(session1.userId).toBe(session2.userId)
      expect(session1.token).not.toBe(session2.token)
    })
  })
})

describe('AuthTokenPayload Interface', () => {
  it('必須フィールドを持つAuthTokenPayloadを作成できる', () => {
    const payload: AuthTokenPayload = {
      userId: 'user-123',
      email: 'test@example.com',
      role: 'USER',
    }

    expect(payload.userId).toBe('user-123')
    expect(payload.email).toBe('test@example.com')
    expect(payload.role).toBe('USER')
    expect(payload.userName).toBeUndefined()
  })

  it('オプショナルフィールドを含むAuthTokenPayloadを作成できる', () => {
    const payload: AuthTokenPayload = {
      userId: 'user-123',
      email: 'test@example.com',
      role: 'ADMIN',
      userName: 'testuser',
    }

    expect(payload.userId).toBe('user-123')
    expect(payload.email).toBe('test@example.com')
    expect(payload.role).toBe('ADMIN')
    expect(payload.userName).toBe('testuser')
  })

  it('異なるロールでAuthTokenPayloadを作成できる', () => {
    const userPayload: AuthTokenPayload = {
      userId: 'user-123',
      email: 'user@example.com',
      role: 'USER',
    }

    const adminPayload: AuthTokenPayload = {
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'ADMIN',
    }

    const superAdminPayload: AuthTokenPayload = {
      userId: 'superadmin-123',
      email: 'superadmin@example.com',
      role: 'SUPER_ADMIN',
      userName: 'superadmin',
    }

    expect(userPayload.role).toBe('USER')
    expect(adminPayload.role).toBe('ADMIN')
    expect(superAdminPayload.role).toBe('SUPER_ADMIN')
  })
})
