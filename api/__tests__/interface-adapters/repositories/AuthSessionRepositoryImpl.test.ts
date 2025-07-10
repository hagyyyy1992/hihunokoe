import { AuthSessionRepositoryImpl } from '@api/interface-adapters/repositories/AuthSessionRepositoryImpl'
import { AuthSession } from '@api/domain/entities/AuthSession'
import { v4 as uuidv4 } from 'uuid'

describe('AuthSessionRepositoryImpl', () => {
  let repository: AuthSessionRepositoryImpl

  beforeEach(() => {
    repository = new AuthSessionRepositoryImpl()
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('認証セッションを作成できる', async () => {
      const session = new AuthSession(
        uuidv4(),
        uuidv4(),
        'test-token-123',
        new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
        new Date()
      )

      await repository.create(session)

      const found = await repository.findByToken('test-token-123')
      expect(found).toBeDefined()
      expect(found?.userId).toBe(session.userId)
      expect(found?.token).toBe(session.token)
    })

    it('IDがない場合自動生成される', async () => {
      const session = new AuthSession(
        '', // 空のIDを渡す
        uuidv4(),
        'test-token-456',
        new Date(Date.now() + 24 * 60 * 60 * 1000),
        new Date()
      )

      await repository.create(session)

      const found = await repository.findByToken('test-token-456')
      expect(found).toBeDefined()
      expect(found?.id).toBeTruthy() // IDが生成されている
    })
  })

  describe('findByToken', () => {
    it('トークンでセッションを検索できる', async () => {
      const token = 'test-token-123'
      const session = new AuthSession(
        uuidv4(),
        uuidv4(),
        token,
        new Date(Date.now() + 24 * 60 * 60 * 1000),
        new Date()
      )

      await repository.create(session)
      const result = await repository.findByToken(token)

      expect(result).toBeDefined()
      expect(result?.token).toBe(token)
      expect(result?.userId).toBe(session.userId)
    })

    it('存在しないトークンの場合nullを返す', async () => {
      const result = await repository.findByToken('non-existent-token')

      expect(result).toBeNull()
    })

    it('期限切れセッションはnullを返す', async () => {
      const token = 'expired-token'
      const session = new AuthSession(
        uuidv4(),
        uuidv4(),
        token,
        new Date(Date.now() - 1000), // 1秒前に期限切れ
        new Date()
      )

      await repository.create(session)
      const result = await repository.findByToken(token)

      expect(result).toBeNull()
    })

    it('無効化されたセッションはnullを返す', async () => {
      const token = 'invalid-token'
      const sessionId = uuidv4()
      const session = new AuthSession(
        sessionId,
        uuidv4(),
        token,
        new Date(Date.now() + 24 * 60 * 60 * 1000),
        new Date()
      )

      await repository.create(session)
      await repository.invalidate(sessionId)

      const result = await repository.findByToken(token)

      expect(result).toBeNull()
    })
  })

  describe('findById', () => {
    it('IDでセッションを検索できる', async () => {
      const sessionId = uuidv4()
      const session = new AuthSession(
        sessionId,
        uuidv4(),
        'test-token',
        new Date(Date.now() + 24 * 60 * 60 * 1000),
        new Date()
      )

      await repository.create(session)
      const result = await repository.findById(sessionId)

      expect(result).toBeDefined()
      expect(result?.id).toBe(sessionId)
    })

    it('存在しないIDの場合nullを返す', async () => {
      const result = await repository.findById(uuidv4())

      expect(result).toBeNull()
    })

    it('期限切れセッションはnullを返す', async () => {
      const sessionId = uuidv4()
      const session = new AuthSession(
        sessionId,
        uuidv4(),
        'expired-token',
        new Date(Date.now() - 1000), // 期限切れ
        new Date()
      )

      await repository.create(session)
      const result = await repository.findById(sessionId)

      expect(result).toBeNull()
    })
  })

  describe('deleteByToken', () => {
    it('トークンでセッションを削除できる', async () => {
      const token = 'test-token-123'
      const session = new AuthSession(
        uuidv4(),
        uuidv4(),
        token,
        new Date(Date.now() + 24 * 60 * 60 * 1000),
        new Date()
      )

      await repository.create(session)
      await repository.deleteByToken(token)

      const result = await repository.findByToken(token)
      expect(result).toBeNull()
    })

    it('存在しないトークンでもエラーにならない', async () => {
      await expect(repository.deleteByToken('non-existent')).resolves.not.toThrow()
    })
  })

  describe('deleteByUserId', () => {
    it('ユーザーIDで全セッションを削除できる', async () => {
      const userId = uuidv4()
      const sessions = [
        new AuthSession(
          uuidv4(),
          userId,
          'token-1',
          new Date(Date.now() + 24 * 60 * 60 * 1000),
          new Date()
        ),
        new AuthSession(
          uuidv4(),
          userId,
          'token-2',
          new Date(Date.now() + 48 * 60 * 60 * 1000),
          new Date()
        ),
        new AuthSession(
          uuidv4(),
          uuidv4(),
          'token-3',
          new Date(Date.now() + 24 * 60 * 60 * 1000),
          new Date()
        ), // 別ユーザー
      ]

      for (const session of sessions) {
        await repository.create(session)
      }

      await repository.deleteByUserId(userId)

      expect(await repository.findByToken('token-1')).toBeNull()
      expect(await repository.findByToken('token-2')).toBeNull()
      expect(await repository.findByToken('token-3')).toBeDefined() // 別ユーザーのセッションは残る
    })

    it('セッションがなくてもエラーにならない', async () => {
      await expect(repository.deleteByUserId(uuidv4())).resolves.not.toThrow()
    })
  })

  describe('deleteExpiredSessions', () => {
    it('期限切れセッションを削除できる', async () => {
      const sessions = [
        new AuthSession(uuidv4(), uuidv4(), 'expired-1', new Date(Date.now() - 1000), new Date()), // 期限切れ
        new AuthSession(uuidv4(), uuidv4(), 'expired-2', new Date(Date.now() - 2000), new Date()), // 期限切れ
        new AuthSession(uuidv4(), uuidv4(), 'valid-1', new Date(Date.now() + 1000), new Date()), // 有効
      ]

      for (const session of sessions) {
        await repository.create(session)
      }

      await repository.deleteExpiredSessions()

      expect(await repository.findByToken('expired-1')).toBeNull()
      expect(await repository.findByToken('expired-2')).toBeNull()
      expect(await repository.findByToken('valid-1')).toBeDefined()
    })
  })

  describe('invalidate', () => {
    it('セッションを無効化できる', async () => {
      const sessionId = uuidv4()
      const session = new AuthSession(
        sessionId,
        uuidv4(),
        'test-token',
        new Date(Date.now() + 24 * 60 * 60 * 1000),
        new Date()
      )

      await repository.create(session)
      await repository.invalidate(sessionId)

      const result = await repository.findByToken('test-token')
      expect(result).toBeNull()
    })

    it('存在しないIDでもエラーにならない', async () => {
      await expect(repository.invalidate(uuidv4())).resolves.not.toThrow()
    })
  })

  describe('invalidateAllUserSessions', () => {
    it('ユーザーの全セッションを無効化できる', async () => {
      const userId = uuidv4()
      const sessions = [
        new AuthSession(
          uuidv4(),
          userId,
          'token-1',
          new Date(Date.now() + 24 * 60 * 60 * 1000),
          new Date()
        ),
        new AuthSession(
          uuidv4(),
          userId,
          'token-2',
          new Date(Date.now() + 48 * 60 * 60 * 1000),
          new Date()
        ),
        new AuthSession(
          uuidv4(),
          uuidv4(),
          'token-3',
          new Date(Date.now() + 24 * 60 * 60 * 1000),
          new Date()
        ), // 別ユーザー
      ]

      for (const session of sessions) {
        await repository.create(session)
      }

      await repository.invalidateAllUserSessions(userId)

      expect(await repository.findByToken('token-1')).toBeNull()
      expect(await repository.findByToken('token-2')).toBeNull()
      expect(await repository.findByToken('token-3')).toBeDefined() // 別ユーザーのセッションは有効
    })

    it('セッションがなくてもエラーにならない', async () => {
      await expect(repository.invalidateAllUserSessions(uuidv4())).resolves.not.toThrow()
    })
  })

  describe('セッションの有効期限', () => {
    it('期限切れセッションは自動的にクリーンアップされる', async () => {
      const expiredSession = new AuthSession(
        uuidv4(),
        uuidv4(),
        'expired-token',
        new Date(Date.now() - 1000),
        new Date()
      )

      await repository.create(expiredSession)

      // findByTokenは期限切れセッションを自動削除する
      const result = await repository.findByToken('expired-token')
      expect(result).toBeNull()

      // 再度検索してもnull
      const secondResult = await repository.findByToken('expired-token')
      expect(secondResult).toBeNull()
    })
  })

  describe('同時実行', () => {
    it('複数のセッションを同時に作成できる', async () => {
      const sessions = Array.from(
        { length: 10 },
        (_, i) =>
          new AuthSession(
            uuidv4(),
            uuidv4(),
            `token-${i}`,
            new Date(Date.now() + 24 * 60 * 60 * 1000),
            new Date()
          )
      )

      await Promise.all(sessions.map(session => repository.create(session)))

      for (let i = 0; i < 10; i++) {
        const found = await repository.findByToken(`token-${i}`)
        expect(found).toBeDefined()
      }
    })
  })
})
