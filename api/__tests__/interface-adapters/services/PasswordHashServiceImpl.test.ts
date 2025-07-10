import { PasswordHashServiceImpl } from '@api/interface-adapters/services/PasswordHashServiceImpl'

// bcryptのモックを個別に定義
const mockHash = jest.fn()
const mockCompare = jest.fn()

// bcryptモジュール全体をモック
jest.mock('bcrypt', () => {
  return {
    default: {
      hash: mockHash,
      compare: mockCompare,
    },
    hash: mockHash,
    compare: mockCompare,
  }
})

describe('PasswordHashServiceImpl', () => {
  let passwordHashService: PasswordHashServiceImpl

  beforeEach(() => {
    jest.clearAllMocks()
    passwordHashService = new PasswordHashServiceImpl()
  })

  describe('hash', () => {
    it('パスワードをハッシュ化できる', async () => {
      const password = 'SecurePassword123!'
      const hashedPassword = '$2b$10$abcdefghijklmnopqrstuvwxyz123456'

      mockHash.mockResolvedValue(hashedPassword as never)

      const result = await passwordHashService.hash(password)

      expect(mockHash).toHaveBeenCalledWith(password, 10)
      expect(result).toBe(hashedPassword)
    })

    it('空のパスワードでもハッシュ化できる', async () => {
      const password = ''
      const hashedPassword = '$2b$10$emptypasswordhash'

      mockHash.mockResolvedValue(hashedPassword as never)

      const result = await passwordHashService.hash(password)

      expect(mockHash).toHaveBeenCalledWith(password, 10)
      expect(result).toBe(hashedPassword)
    })

    it('非常に長いパスワードもハッシュ化できる', async () => {
      const password = 'a'.repeat(100)
      const hashedPassword = '$2b$10$longpasswordhash'

      mockHash.mockResolvedValue(hashedPassword as never)

      const result = await passwordHashService.hash(password)

      expect(mockHash).toHaveBeenCalledWith(password, 10)
      expect(result).toBe(hashedPassword)
    })

    it('特殊文字を含むパスワードもハッシュ化できる', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const hashedPassword = '$2b$10$specialcharshash'

      mockHash.mockResolvedValue(hashedPassword as never)

      const result = await passwordHashService.hash(password)

      expect(mockHash).toHaveBeenCalledWith(password, 10)
      expect(result).toBe(hashedPassword)
    })

    it('ハッシュ化でエラーが発生した場合、エラーを伝播する', async () => {
      const error = new Error('Hashing failed')
      mockHash.mockRejectedValue(error)

      await expect(passwordHashService.hash('password')).rejects.toThrow('Hashing failed')
    })
  })

  describe('compare', () => {
    it('正しいパスワードの場合trueを返す', async () => {
      const password = 'CorrectPassword123'
      const hashedPassword = '$2b$10$correcthash'

      mockCompare.mockResolvedValue(true as never)

      const result = await passwordHashService.compare(password, hashedPassword)

      expect(mockCompare).toHaveBeenCalledWith(password, hashedPassword)
      expect(result).toBe(true)
    })

    it('間違ったパスワードの場合falseを返す', async () => {
      const password = 'WrongPassword123'
      const hashedPassword = '$2b$10$correcthash'

      mockCompare.mockResolvedValue(false as never)

      const result = await passwordHashService.compare(password, hashedPassword)

      expect(mockCompare).toHaveBeenCalledWith(password, hashedPassword)
      expect(result).toBe(false)
    })

    it('空のパスワードでも比較できる', async () => {
      const password = ''
      const hashedPassword = '$2b$10$emptypasswordhash'

      mockCompare.mockResolvedValue(false as never)

      const result = await passwordHashService.compare(password, hashedPassword)

      expect(mockCompare).toHaveBeenCalledWith(password, hashedPassword)
      expect(result).toBe(false)
    })

    it('ハッシュが不正な形式でもエラーにならない', async () => {
      const password = 'password'
      const invalidHash = 'not-a-valid-hash'

      mockCompare.mockResolvedValue(false as never)

      const result = await passwordHashService.compare(password, invalidHash)

      expect(mockCompare).toHaveBeenCalledWith(password, invalidHash)
      expect(result).toBe(false)
    })

    it('比較でエラーが発生した場合、エラーを伝播する', async () => {
      const error = new Error('Comparison failed')
      mockCompare.mockRejectedValue(error)

      await expect(passwordHashService.compare('password', '$2b$10$hash')).rejects.toThrow(
        'Comparison failed'
      )
    })
  })

  describe('セキュリティ関連', () => {
    it('同じパスワードでも異なるハッシュが生成される', async () => {
      const password = 'SamePassword123'
      const hash1 = '$2b$10$hash1abcdefghijklmnopqrstuvwxyz'
      const hash2 = '$2b$10$hash2zyxwvutsrqponmlkjihgfedcba'

      // 最初の呼び出し
      mockHash.mockResolvedValueOnce(hash1 as never)
      const result1 = await passwordHashService.hash(password)

      // 2回目の呼び出し
      mockHash.mockResolvedValueOnce(hash2 as never)
      const result2 = await passwordHashService.hash(password)

      expect(result1).not.toBe(result2)
      expect(mockHash).toHaveBeenCalledTimes(2)
    })

    it('ソルトラウンド数が10であることを確認', async () => {
      await passwordHashService.hash('password')

      expect(mockHash).toHaveBeenCalledWith('password', 10)
    })
  })

  describe('パフォーマンス関連', () => {
    it('複数のパスワードを同時にハッシュ化できる', async () => {
      const passwords = ['password1', 'password2', 'password3']
      const hashes = ['$2b$10$hash1', '$2b$10$hash2', '$2b$10$hash3']

      mockHash
        .mockResolvedValueOnce(hashes[0] as never)
        .mockResolvedValueOnce(hashes[1] as never)
        .mockResolvedValueOnce(hashes[2] as never)

      const results = await Promise.all(passwords.map(pwd => passwordHashService.hash(pwd)))

      expect(results).toEqual(hashes)
      expect(mockHash).toHaveBeenCalledTimes(3)
    })

    it('複数のパスワードを同時に比較できる', async () => {
      const comparisons = [
        { password: 'correct1', hash: '$2b$10$hash1', expected: true },
        { password: 'wrong2', hash: '$2b$10$hash2', expected: false },
        { password: 'correct3', hash: '$2b$10$hash3', expected: true },
      ]

      mockCompare
        .mockResolvedValueOnce(true as never)
        .mockResolvedValueOnce(false as never)
        .mockResolvedValueOnce(true as never)

      const results = await Promise.all(
        comparisons.map(({ password, hash }) => passwordHashService.compare(password, hash))
      )

      expect(results).toEqual([true, false, true])
      expect(mockCompare).toHaveBeenCalledTimes(3)
    })
  })
})
