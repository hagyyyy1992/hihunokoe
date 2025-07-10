import { TokenServiceImpl } from '@api/interface-adapters/services/TokenServiceImpl'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { AuthTokenPayload } from '@api/domain/entities/AuthSession'

// JWTとcryptoのモック
jest.mock('jsonwebtoken')
jest.mock('crypto')

describe('TokenServiceImpl', () => {
  let tokenService: TokenServiceImpl
  const mockJwt = jwt as jest.Mocked<typeof jwt>
  const mockCrypto = crypto as jest.Mocked<typeof crypto>

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret'
    tokenService = new TokenServiceImpl()
  })

  afterEach(() => {
    delete process.env.JWT_SECRET
    delete process.env.NEXTAUTH_SECRET
  })

  describe('generateToken', () => {
    it('認証トークンを生成できる', async () => {
      const payload: AuthTokenPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'USER',
      }
      const mockToken = 'jwt.token.string'

      mockJwt.sign = jest.fn().mockReturnValue(mockToken)

      const result = await tokenService.generateToken(payload)

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { id: 'user-123', userId: 'user-123', email: 'user@example.com', role: 'USER' },
        'test-secret',
        { expiresIn: '7d' }
      )
      expect(result).toBe(mockToken)
    })

    it('管理者ロールでトークンを生成できる', async () => {
      const payload: AuthTokenPayload = {
        userId: 'admin-123',
        email: 'admin@example.com',
        role: 'ADMIN',
      }
      const mockToken = 'admin.jwt.token'

      mockJwt.sign = jest.fn().mockReturnValue(mockToken)

      const result = await tokenService.generateToken(payload)

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { id: 'admin-123', userId: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
        'test-secret',
        { expiresIn: '7d' }
      )
      expect(result).toBe(mockToken)
    })

    it('NEXTAUTH_SECRETを優先的に使用する', async () => {
      process.env.NEXTAUTH_SECRET = 'nextauth-secret'
      tokenService = new TokenServiceImpl()

      const payload: AuthTokenPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'USER',
      }

      mockJwt.sign = jest.fn().mockReturnValue('token')

      await tokenService.generateToken(payload)

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        'nextauth-secret',
        expect.any(Object)
      )
    })
  })

  describe('verifyToken', () => {
    it('有効なトークンを検証できる', async () => {
      const token = 'valid.jwt.token'
      const decodedPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'USER',
        iat: 1234567890,
        exp: 1234654290,
      }

      mockJwt.verify = jest.fn().mockReturnValue(decodedPayload)

      const result = await tokenService.verifyToken(token)

      expect(mockJwt.verify).toHaveBeenCalledWith(token, 'test-secret')
      expect(result).toEqual({
        userId: 'user-123',
        email: 'user@example.com',
        role: 'USER',
        userName: undefined,
      })
    })

    it('レガシー形式のトークン（idフィールド）を処理できる', async () => {
      const token = 'legacy.jwt.token'
      const decodedPayload = {
        id: 'user-123', // レガシー形式
        email: 'user@example.com',
        iat: 1234567890,
        exp: 1234654290,
      }

      mockJwt.verify = jest.fn().mockReturnValue(decodedPayload)

      const result = await tokenService.verifyToken(token)

      expect(result).toEqual({
        userId: 'user-123',
        email: 'user@example.com',
        role: 'USER',
        userName: undefined,
      })
    })

    it('無効なトークンの場合エラーを投げる', async () => {
      const token = 'invalid.jwt.token'

      mockJwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('invalid token')
      })

      await expect(tokenService.verifyToken(token)).rejects.toThrow('Invalid token')
    })

    it('ユーザーIDがないトークンの場合エラーを投げる', async () => {
      const token = 'token.without.userid'
      const decodedPayload = {
        email: 'user@example.com',
        // userIdもidもない
      }

      mockJwt.verify = jest.fn().mockReturnValue(decodedPayload)

      await expect(tokenService.verifyToken(token)).rejects.toThrow('Invalid token')
    })
  })

  describe('verifyAuthToken', () => {
    it('有効なトークンを検証してユーザーIDを返す', async () => {
      const token = 'valid.jwt.token'
      const decodedPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'USER',
      }

      mockJwt.verify = jest.fn().mockReturnValue(decodedPayload)

      const result = await tokenService.verifyAuthToken(token)

      expect(mockJwt.verify).toHaveBeenCalledWith(token, 'test-secret')
      expect(result).toBe('user-123')
    })

    it('無効なトークンの場合nullを返す', async () => {
      const token = 'invalid.jwt.token'

      mockJwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('invalid token')
      })

      const result = await tokenService.verifyAuthToken(token)

      expect(result).toBeNull()
    })

    it('期限切れトークンの場合nullを返す', async () => {
      const token = 'expired.jwt.token'

      mockJwt.verify = jest.fn().mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired', new Date())
      })

      const result = await tokenService.verifyAuthToken(token)

      expect(result).toBeNull()
    })
  })

  describe('generateRandomToken', () => {
    it('ランダムトークンを生成できる', () => {
      const mockBuffer = Buffer.from('1234567890abcdef1234567890abcdef')
      const mockToken = '3132333435363738393061626364656631323334353637383930616263646566'

      mockCrypto.randomBytes = jest.fn().mockReturnValue(mockBuffer)

      const result = tokenService.generateRandomToken()

      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32)
      expect(result).toBe(mockToken)
    })
  })

  describe('generatePasswordResetToken', () => {
    it('パスワードリセットトークンを生成できる', async () => {
      const mockBuffer = Buffer.from('passwordresettoken1234567890abcd')
      const mockToken = '70617373776f72647265736574746f6b656e3132333435363738393061626364'

      mockCrypto.randomBytes = jest.fn().mockReturnValue(mockBuffer)

      const result = await tokenService.generatePasswordResetToken('user-123')

      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32)
      expect(result).toBe(mockToken)
    })

    it('毎回異なるトークンを生成する', async () => {
      const mockBuffer1 = Buffer.from('token1')
      const mockBuffer2 = Buffer.from('token2')

      mockCrypto.randomBytes = jest
        .fn()
        .mockReturnValueOnce(mockBuffer1)
        .mockReturnValueOnce(mockBuffer2)

      const token1 = await tokenService.generatePasswordResetToken('user-123')
      const token2 = await tokenService.generatePasswordResetToken('user-123')

      expect(token1).not.toBe(token2)
      expect(mockCrypto.randomBytes).toHaveBeenCalledTimes(2)
    })
  })

  describe('verifyPasswordResetToken', () => {
    it('有効なトークンの場合validを返す', async () => {
      const token = 'valid-reset-token'

      const result = await tokenService.verifyPasswordResetToken(token)

      expect(result).toBe('valid')
    })

    it('空のトークンの場合nullを返す', async () => {
      const result = await tokenService.verifyPasswordResetToken('')

      expect(result).toBeNull()
    })
  })

  describe('generateEmailVerificationToken', () => {
    it('メール確認トークンを生成できる', async () => {
      const mockBuffer = Buffer.from('emailverifytoken1234567890abcdef')
      const mockToken = '656d61696c766572696679746f6b656e31323334353637383930616263646566'

      mockCrypto.randomBytes = jest.fn().mockReturnValue(mockBuffer)

      const result = await tokenService.generateEmailVerificationToken('user-123')

      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32)
      expect(result).toBe(mockToken)
    })
  })

  describe('generateEmailToken', () => {
    it('メールトークンを生成できる', async () => {
      const mockBuffer = Buffer.from('emailtoken1234567890abcdefghijkl')
      const mockToken = '656d61696c746f6b656e313233343536373839306162636465666768696a6b6c'

      mockCrypto.randomBytes = jest.fn().mockReturnValue(mockBuffer)

      const result = await tokenService.generateEmailToken('user-123')

      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32)
      expect(result).toBe(mockToken)
    })
  })

  describe('verifyEmailToken', () => {
    it('メールトークンの検証はnullを返す（リポジトリで実装）', async () => {
      const result = await tokenService.verifyEmailToken('some-token')

      expect(result).toBeNull()
    })
  })

  describe('invalidatePasswordResetToken', () => {
    it('パスワードリセットトークンを無効化できる', async () => {
      await expect(tokenService.invalidatePasswordResetToken('token')).resolves.not.toThrow()
    })
  })

  describe('invalidateEmailToken', () => {
    it('メールトークンを無効化できる', async () => {
      await expect(tokenService.invalidateEmailToken('token')).resolves.not.toThrow()
    })
  })

  describe('セキュリティ関連', () => {
    it('トークンの有効期限が7日間である', async () => {
      const payload: AuthTokenPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'USER',
      }

      mockJwt.sign = jest.fn().mockReturnValue('token')

      await tokenService.generateToken(payload)

      expect(mockJwt.sign).toHaveBeenCalledWith(expect.any(Object), expect.any(String), {
        expiresIn: '7d',
      })
    })

    it('環境変数が設定されていない場合、デフォルトのシークレットを使用する', async () => {
      delete process.env.JWT_SECRET
      delete process.env.NEXTAUTH_SECRET
      tokenService = new TokenServiceImpl()

      const payload: AuthTokenPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'USER',
      }

      mockJwt.sign = jest.fn().mockReturnValue('token')

      await tokenService.generateToken(payload)

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        'your-secret-key',
        expect.any(Object)
      )
    })
  })
})
