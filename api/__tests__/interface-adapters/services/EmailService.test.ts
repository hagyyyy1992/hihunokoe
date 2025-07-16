import { EmailService } from '@api/interface-adapters/services/EmailService'

// jest.mock()は最初に呼び出す必要がある
jest.mock('@/lib/email/email', () => ({
  sendEmail: jest.fn(),
  generatePasswordResetEmailHtml: jest.fn(),
  generatePasswordResetEmailText: jest.fn(),
  generateVerificationEmailHtml: jest.fn(),
  generateVerificationEmailText: jest.fn(),
}))

// モック関数を取得
const emailMock = require('@/lib/email/email')
const mockSendEmail = emailMock.sendEmail as jest.Mock
const mockGeneratePasswordResetEmailHtml = emailMock.generatePasswordResetEmailHtml as jest.Mock
const mockGeneratePasswordResetEmailText = emailMock.generatePasswordResetEmailText as jest.Mock
const mockGenerateVerificationEmailHtml = emailMock.generateVerificationEmailHtml as jest.Mock
const mockGenerateVerificationEmailText = emailMock.generateVerificationEmailText as jest.Mock

describe('EmailService', () => {
  let emailService: EmailService

  beforeEach(() => {
    jest.clearAllMocks()
    emailService = new EmailService()
  })

  describe('sendPasswordResetEmail', () => {
    it('パスワードリセットメールを送信できる', async () => {
      const email = 'user@example.com'
      const userName = 'テストユーザー'
      const resetToken = 'reset-token-123'
      const baseUrl = 'https://example.com'

      const mockHtml = '<html>パスワードリセット</html>'
      const mockText = 'パスワードリセット'

      mockGeneratePasswordResetEmailHtml.mockReturnValue(mockHtml)
      mockGeneratePasswordResetEmailText.mockReturnValue(mockText)
      mockSendEmail.mockResolvedValue(undefined)

      await emailService.sendPasswordResetEmail(email, userName, resetToken, baseUrl)

      expect(mockGeneratePasswordResetEmailHtml).toHaveBeenCalledWith(
        userName,
        'https://example.com/auth/reset-password?token=reset-token-123'
      )
      expect(mockGeneratePasswordResetEmailText).toHaveBeenCalledWith(
        userName,
        'https://example.com/auth/reset-password?token=reset-token-123'
      )
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: email,
        subject: '【化粧品体験共有サービス】パスワードリセット',
        html: mockHtml,
        text: mockText,
      })
    })

    it('baseURLが指定されていない場合はデフォルトを使用する', async () => {
      // 環境変数を一時的に保存してクリア
      const originalApiUrl = process.env.API_URL
      const originalNextPublicApiUrl = process.env.NEXT_PUBLIC_API_URL
      delete process.env.API_URL
      delete process.env.NEXT_PUBLIC_API_URL

      const email = 'user@example.com'
      const userName = 'テストユーザー'
      const resetToken = 'reset-token-456'

      mockGeneratePasswordResetEmailHtml.mockReturnValue('<html></html>')
      mockGeneratePasswordResetEmailText.mockReturnValue('text')
      mockSendEmail.mockResolvedValue(undefined)

      await emailService.sendPasswordResetEmail(email, userName, resetToken)

      expect(mockGeneratePasswordResetEmailHtml).toHaveBeenCalledWith(
        userName,
        'http://localhost:3000/auth/reset-password?token=reset-token-456'
      )

      // 環境変数を復元
      if (originalApiUrl !== undefined) process.env.API_URL = originalApiUrl
      if (originalNextPublicApiUrl !== undefined)
        process.env.NEXT_PUBLIC_API_URL = originalNextPublicApiUrl
    })

    it('環境変数からAPIのURLを取得する', async () => {
      // 環境変数を一時的に保存してクリア
      const originalApiUrl = process.env.API_URL
      const originalNextPublicApiUrl = process.env.NEXT_PUBLIC_API_URL
      delete process.env.NEXT_PUBLIC_API_URL

      process.env.API_URL = 'https://api.example.com'

      const email = 'user@example.com'
      const userName = 'テストユーザー'
      const resetToken = 'reset-token-789'

      mockGeneratePasswordResetEmailHtml.mockReturnValue('<html></html>')
      mockGeneratePasswordResetEmailText.mockReturnValue('text')
      mockSendEmail.mockResolvedValue(undefined)

      await emailService.sendPasswordResetEmail(email, userName, resetToken)

      expect(mockGeneratePasswordResetEmailHtml).toHaveBeenCalledWith(
        userName,
        'https://api.example.com/auth/reset-password?token=reset-token-789'
      )

      // 環境変数を復元
      delete process.env.API_URL
      if (originalApiUrl !== undefined) process.env.API_URL = originalApiUrl
      if (originalNextPublicApiUrl !== undefined)
        process.env.NEXT_PUBLIC_API_URL = originalNextPublicApiUrl
    })
  })

  describe('sendVerificationEmail', () => {
    it('メール確認メールを送信できる', async () => {
      const email = 'user@example.com'
      const userName = 'テストユーザー'
      const verificationToken = 'verify-token-123'
      const baseUrl = 'https://example.com'

      const mockHtml = '<html>メール確認</html>'
      const mockText = 'メール確認'

      mockGenerateVerificationEmailHtml.mockReturnValue(mockHtml)
      mockGenerateVerificationEmailText.mockReturnValue(mockText)
      mockSendEmail.mockResolvedValue(undefined)

      await emailService.sendVerificationEmail(email, userName, verificationToken, baseUrl)

      expect(mockGenerateVerificationEmailHtml).toHaveBeenCalledWith(
        userName,
        'https://example.com/auth/verify-email?token=verify-token-123'
      )
      expect(mockGenerateVerificationEmailText).toHaveBeenCalledWith(
        userName,
        'https://example.com/auth/verify-email?token=verify-token-123'
      )
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: email,
        subject: '【化粧品体験共有サービス】メールアドレスの確認',
        html: mockHtml,
        text: mockText,
      })
    })

    it('baseURLが指定されていない場合はデフォルトを使用する', async () => {
      // 環境変数を一時的に保存してクリア
      const originalApiUrl = process.env.API_URL
      const originalNextPublicApiUrl = process.env.NEXT_PUBLIC_API_URL
      delete process.env.API_URL
      delete process.env.NEXT_PUBLIC_API_URL

      const email = 'user@example.com'
      const userName = 'テストユーザー'
      const verificationToken = 'verify-token-456'

      mockGenerateVerificationEmailHtml.mockReturnValue('<html></html>')
      mockGenerateVerificationEmailText.mockReturnValue('text')
      mockSendEmail.mockResolvedValue(undefined)

      await emailService.sendVerificationEmail(email, userName, verificationToken)

      expect(mockGenerateVerificationEmailHtml).toHaveBeenCalledWith(
        userName,
        'http://localhost:3000/auth/verify-email?token=verify-token-456'
      )

      // 環境変数を復元
      if (originalApiUrl !== undefined) process.env.API_URL = originalApiUrl
      if (originalNextPublicApiUrl !== undefined)
        process.env.NEXT_PUBLIC_API_URL = originalNextPublicApiUrl
    })

    it('NEXT_PUBLIC_API_URLを使用する（API_URLがない場合）', async () => {
      // 環境変数を一時的に保存
      const originalApiUrl = process.env.API_URL
      const originalNextPublicApiUrl = process.env.NEXT_PUBLIC_API_URL

      // API_URLをクリアして、NEXT_PUBLIC_API_URLを設定
      delete process.env.API_URL
      process.env.NEXT_PUBLIC_API_URL = 'https://public.example.com'

      const email = 'user@example.com'
      const userName = 'テストユーザー'
      const verificationToken = 'verify-token-789'

      mockGenerateVerificationEmailHtml.mockReturnValue('<html></html>')
      mockGenerateVerificationEmailText.mockReturnValue('text')
      mockSendEmail.mockResolvedValue(undefined)

      await emailService.sendVerificationEmail(email, userName, verificationToken)

      expect(mockGenerateVerificationEmailHtml).toHaveBeenCalledWith(
        userName,
        'https://public.example.com/auth/verify-email?token=verify-token-789'
      )

      // 環境変数を復元
      if (originalApiUrl !== undefined) process.env.API_URL = originalApiUrl
      if (originalNextPublicApiUrl !== undefined)
        process.env.NEXT_PUBLIC_API_URL = originalNextPublicApiUrl
    })
  })

  describe('エラーハンドリング', () => {
    it('sendEmail関数のエラーが伝播される', async () => {
      const email = 'user@example.com'
      const userName = 'テストユーザー'
      const resetToken = 'reset-token-error'
      const error = new Error('Failed to send email')

      mockGeneratePasswordResetEmailHtml.mockReturnValue('<html></html>')
      mockGeneratePasswordResetEmailText.mockReturnValue('text')
      mockSendEmail.mockRejectedValue(error)

      await expect(
        emailService.sendPasswordResetEmail(email, userName, resetToken)
      ).rejects.toThrow('Failed to send email')
    })

    it('HTML生成エラーが伝播される', async () => {
      const email = 'user@example.com'
      const userName = 'テストユーザー'
      const verificationToken = 'verify-token-error'
      const error = new Error('HTML generation failed')

      mockGenerateVerificationEmailHtml.mockImplementation(() => {
        throw error
      })

      await expect(
        emailService.sendVerificationEmail(email, userName, verificationToken)
      ).rejects.toThrow('HTML generation failed')
    })
  })

  describe('複数メール送信', () => {
    it('複数のメールを同時に送信できる', async () => {
      mockGeneratePasswordResetEmailHtml.mockReturnValue('<html></html>')
      mockGeneratePasswordResetEmailText.mockReturnValue('text')
      mockGenerateVerificationEmailHtml.mockReturnValue('<html></html>')
      mockGenerateVerificationEmailText.mockReturnValue('text')
      mockSendEmail.mockResolvedValue(undefined)

      const promises = [
        emailService.sendPasswordResetEmail('user1@example.com', 'ユーザー1', 'token1'),
        emailService.sendPasswordResetEmail('user2@example.com', 'ユーザー2', 'token2'),
        emailService.sendVerificationEmail('user3@example.com', 'ユーザー3', 'token3'),
      ]

      await Promise.all(promises)

      expect(mockSendEmail).toHaveBeenCalledTimes(3)
    })
  })
})
