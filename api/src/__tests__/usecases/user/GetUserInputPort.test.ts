import { GetUserInputPort } from '../../../usecases/user/GetUserInputPort'
import { GetUserUseCaseInput, GetUserUseCaseOutput } from '../../../usecases/user/GetUserUseCase'
import { User } from '../../../domain/entities/User'

class MockGetUserInputPort implements GetUserInputPort {
  private mockExecute = jest.fn()

  async execute(input: GetUserUseCaseInput): Promise<GetUserUseCaseOutput> {
    return this.mockExecute(input)
  }

  getMockExecute() {
    return this.mockExecute
  }

  reset() {
    this.mockExecute.mockReset()
  }
}

describe('GetUserInputPort モック化テスト', () => {
  let mockGetUserInputPort: MockGetUserInputPort

  beforeEach(() => {
    mockGetUserInputPort = new MockGetUserInputPort()
  })

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    emailVerified: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  }

  describe('正常系テスト', () => {
    it('ユーザーIDを指定してユーザー情報を取得できる', async () => {
      const input: GetUserUseCaseInput = { userId: 'user-123' }
      const expectedOutput: GetUserUseCaseOutput = { user: mockUser }

      mockGetUserInputPort.getMockExecute().mockResolvedValue(expectedOutput)

      const result = await mockGetUserInputPort.execute(input)

      expect(mockGetUserInputPort.getMockExecute()).toHaveBeenCalledWith(input)
      expect(mockGetUserInputPort.getMockExecute()).toHaveBeenCalledTimes(1)
      expect(result).toEqual(expectedOutput)
      expect(result.user.id).toBe('user-123')
      expect(result.user.email).toBe('test@example.com')
    })

    it('異なるユーザーIDで複数回呼び出しができる', async () => {
      const user1 = { ...mockUser, id: 'user-1', email: 'user1@example.com' }
      const user2 = { ...mockUser, id: 'user-2', email: 'user2@example.com' }

      mockGetUserInputPort
        .getMockExecute()
        .mockResolvedValueOnce({ user: user1 })
        .mockResolvedValueOnce({ user: user2 })

      const result1 = await mockGetUserInputPort.execute({ userId: 'user-1' })
      const result2 = await mockGetUserInputPort.execute({ userId: 'user-2' })

      expect(result1.user.id).toBe('user-1')
      expect(result2.user.id).toBe('user-2')
      expect(mockGetUserInputPort.getMockExecute()).toHaveBeenCalledTimes(2)
    })

    it('メール認証済みユーザーの情報を正しく返す', async () => {
      const verifiedUser = { ...mockUser, emailVerified: true }
      mockGetUserInputPort.getMockExecute().mockResolvedValue({ user: verifiedUser })

      const result = await mockGetUserInputPort.execute({ userId: 'user-123' })

      expect(result.user.emailVerified).toBe(true)
    })
  })

  describe('異常系テスト', () => {
    it('存在しないユーザーIDの場合エラーを投げる', async () => {
      const input: GetUserUseCaseInput = { userId: 'non-existent-user' }

      mockGetUserInputPort.getMockExecute().mockRejectedValue(new Error('ユーザーが見つかりません'))

      await expect(mockGetUserInputPort.execute(input)).rejects.toThrow('ユーザーが見つかりません')
      expect(mockGetUserInputPort.getMockExecute()).toHaveBeenCalledWith(input)
    })

    it('メール未認証ユーザーの場合エラーを投げる', async () => {
      const input: GetUserUseCaseInput = { userId: 'unverified-user' }

      mockGetUserInputPort
        .getMockExecute()
        .mockRejectedValue(new Error('メールアドレスの確認が必要です'))

      await expect(mockGetUserInputPort.execute(input)).rejects.toThrow(
        'メールアドレスの確認が必要です'
      )
    })

    it('データベースエラーの場合エラーを投げる', async () => {
      const input: GetUserUseCaseInput = { userId: 'user-123' }

      mockGetUserInputPort.getMockExecute().mockRejectedValue(new Error('データベース接続エラー'))

      await expect(mockGetUserInputPort.execute(input)).rejects.toThrow('データベース接続エラー')
    })

    it('不正なユーザーIDフォーマットの場合エラーを投げる', async () => {
      const input: GetUserUseCaseInput = { userId: '' }

      mockGetUserInputPort.getMockExecute().mockRejectedValue(new Error('無効なユーザーIDです'))

      await expect(mockGetUserInputPort.execute(input)).rejects.toThrow('無効なユーザーIDです')
    })
  })

  describe('エッジケーステスト', () => {
    it('非常に長いユーザーIDでも処理できる', async () => {
      const longUserId = 'a'.repeat(1000)
      const input: GetUserUseCaseInput = { userId: longUserId }
      const expectedOutput: GetUserUseCaseOutput = { user: { ...mockUser, id: longUserId } }

      mockGetUserInputPort.getMockExecute().mockResolvedValue(expectedOutput)

      const result = await mockGetUserInputPort.execute(input)

      expect(result.user.id).toBe(longUserId)
      expect(mockGetUserInputPort.getMockExecute()).toHaveBeenCalledWith(input)
    })

    it('特殊文字を含むユーザーIDでも処理できる', async () => {
      const specialUserId = 'user-123-@#$%^&*()'
      const input: GetUserUseCaseInput = { userId: specialUserId }
      const expectedOutput: GetUserUseCaseOutput = { user: { ...mockUser, id: specialUserId } }

      mockGetUserInputPort.getMockExecute().mockResolvedValue(expectedOutput)

      const result = await mockGetUserInputPort.execute(input)

      expect(result.user.id).toBe(specialUserId)
    })

    it('Unicode文字を含むユーザー名でも処理できる', async () => {
      const unicodeUser = {
        ...mockUser,
        username: '테스트사용자',
        email: 'test@例え.jp',
      }
      const expectedOutput: GetUserUseCaseOutput = { user: unicodeUser }

      mockGetUserInputPort.getMockExecute().mockResolvedValue(expectedOutput)

      const result = await mockGetUserInputPort.execute({ userId: 'user-123' })

      expect(result.user.username).toBe('테스트사용자')
      expect(result.user.email).toBe('test@例え.jp')
    })
  })

  describe('モック機能テスト', () => {
    it('モックのリセット機能が正常に動作する', async () => {
      mockGetUserInputPort.getMockExecute().mockResolvedValue({ user: mockUser })

      await mockGetUserInputPort.execute({ userId: 'user-123' })
      expect(mockGetUserInputPort.getMockExecute()).toHaveBeenCalledTimes(1)

      mockGetUserInputPort.reset()
      expect(mockGetUserInputPort.getMockExecute()).toHaveBeenCalledTimes(0)
    })

    it('呼び出し回数の検証ができる', async () => {
      mockGetUserInputPort.getMockExecute().mockResolvedValue({ user: mockUser })

      await mockGetUserInputPort.execute({ userId: 'user-1' })
      await mockGetUserInputPort.execute({ userId: 'user-2' })
      await mockGetUserInputPort.execute({ userId: 'user-3' })

      expect(mockGetUserInputPort.getMockExecute()).toHaveBeenCalledTimes(3)
    })

    it('呼び出し引数の詳細検証ができる', async () => {
      mockGetUserInputPort.getMockExecute().mockResolvedValue({ user: mockUser })

      const input1 = { userId: 'user-1' }
      const input2 = { userId: 'user-2' }

      await mockGetUserInputPort.execute(input1)
      await mockGetUserInputPort.execute(input2)

      expect(mockGetUserInputPort.getMockExecute()).toHaveBeenNthCalledWith(1, input1)
      expect(mockGetUserInputPort.getMockExecute()).toHaveBeenNthCalledWith(2, input2)
    })

    it('条件付きレスポンスの設定ができる', async () => {
      mockGetUserInputPort.getMockExecute().mockImplementation(async input => {
        if (input.userId === 'admin') {
          return { user: { ...mockUser, id: 'admin', username: 'administrator' } }
        }
        if (input.userId === 'guest') {
          throw new Error('ゲストユーザーにはアクセス権限がありません')
        }
        return { user: mockUser }
      })

      const adminResult = await mockGetUserInputPort.execute({ userId: 'admin' })
      expect(adminResult.user.username).toBe('administrator')

      await expect(mockGetUserInputPort.execute({ userId: 'guest' })).rejects.toThrow(
        'ゲストユーザーにはアクセス権限がありません'
      )

      const normalResult = await mockGetUserInputPort.execute({ userId: 'normal' })
      expect(normalResult.user.username).toBe('testuser')
    })
  })

  describe('パフォーマンステスト', () => {
    it('大量の呼び出しでも高速に処理できる', async () => {
      mockGetUserInputPort.getMockExecute().mockResolvedValue({ user: mockUser })

      const startTime = Date.now()

      const promises = Array.from({ length: 1000 }, (_, i) =>
        mockGetUserInputPort.execute({ userId: `user-${i}` })
      )

      await Promise.all(promises)

      const endTime = Date.now()
      const executionTime = endTime - startTime

      expect(executionTime).toBeLessThan(1000) // 1秒以内
      expect(mockGetUserInputPort.getMockExecute()).toHaveBeenCalledTimes(1000)
    })
  })
})
