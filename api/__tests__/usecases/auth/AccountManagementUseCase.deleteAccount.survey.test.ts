import { AccountManagementUseCase } from '@api/usecases/auth/interactor'
import { IUserRepository } from '@api/domain/repositories/UserRepository'
import { IAuthSessionRepository } from '@api/domain/repositories/AuthSessionRepository'
import { PasswordHashService } from '@api/domain/services/PasswordHashService'
import { IEmailService } from '@api/domain/services/EmailService'
import { WithdrawalSurveyRepository } from '@api/domain/repositories/WithdrawalSurveyRepository'
import { User, UserRole } from '@api/domain/entities/User'
import { DeleteAccountInputPort } from '@api/usecases/auth/input-port'

describe('AccountManagementUseCase - deleteAccount - 退会アンケート処理', () => {
  let useCase: AccountManagementUseCase
  let mockUserRepository: jest.Mocked<IUserRepository>
  let mockAuthSessionRepository: jest.Mocked<IAuthSessionRepository>
  let mockPasswordHashService: jest.Mocked<PasswordHashService>
  let mockEmailService: jest.Mocked<IEmailService>
  let mockWithdrawalSurveyRepository: jest.Mocked<WithdrawalSurveyRepository>
  let mockUser: User

  beforeEach(() => {
    // モックユーザーの設定
    mockUser = {
      id: 'user-123',
      userName: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      isActive: true,
      deletedAt: null,
      role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: true,
      emailVerificationToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    } as User

    // モックリポジトリとサービスの設定
    mockUserRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    } as any

    mockAuthSessionRepository = {
      deleteByUserId: jest.fn(),
    } as any

    mockPasswordHashService = {
      compare: jest.fn(),
    } as any

    mockEmailService = {
      sendPasswordResetEmail: jest.fn(),
      sendVerificationEmail: jest.fn(),
      sendWelcomeEmail: jest.fn(),
      sendAccountDeletionEmail: jest.fn(),
    } as any

    mockWithdrawalSurveyRepository = {
      create: jest.fn(),
    } as any

    // デフォルトのモック動作
    mockUserRepository.findById.mockResolvedValue(mockUser)
    mockPasswordHashService.compare.mockResolvedValue(true)
    mockUserRepository.update.mockResolvedValue(mockUser)
    mockAuthSessionRepository.deleteByUserId.mockResolvedValue()

    // UseCaseのインスタンス作成
    useCase = new AccountManagementUseCase(
      mockUserRepository,
      mockAuthSessionRepository,
      mockPasswordHashService,
      mockEmailService,
      mockWithdrawalSurveyRepository
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('退会アンケートがある場合', () => {
    it('退会アンケートを正常に保存できる', async () => {
      const input: DeleteAccountInputPort = {
        userId: 'user-123',
        password: 'password123',
        survey: {
          reason: 'not_useful' as const,
          reasonOther: undefined,
          feedback: 'サービスが期待と違った',
          wouldRecommend: false,
        },
      }

      await useCase.deleteAccount(input)

      // 退会アンケートが保存されたことを確認
      expect(mockWithdrawalSurveyRepository.create).toHaveBeenCalledWith({
        userId: 'user-123',
        reason: 'not_useful',
        reasonOther: undefined,
        feedback: 'サービスが期待と違った',
        wouldRecommend: false,
      })

      // アカウント削除も実行されたことを確認
      expect(mockUserRepository.update).toHaveBeenCalled()
      expect(mockAuthSessionRepository.deleteByUserId).toHaveBeenCalledWith('user-123')
    })

    it('複数選択の理由を含む退会アンケートを保存できる', async () => {
      const input: DeleteAccountInputPort = {
        userId: 'user-123',
        password: 'password123',
        survey: {
          reason: 'other' as const,
          reasonOther:
            '{"allReasons":["not_useful","privacy_concerns","other"],"otherText":"サポートが不十分"}',
          feedback: '複数の理由で退会を決めました',
          wouldRecommend: false,
        },
      }

      await useCase.deleteAccount(input)

      expect(mockWithdrawalSurveyRepository.create).toHaveBeenCalledWith({
        userId: 'user-123',
        reason: 'other',
        reasonOther:
          '{"allReasons":["not_useful","privacy_concerns","other"],"otherText":"サポートが不十分"}',
        feedback: '複数の理由で退会を決めました',
        wouldRecommend: false,
      })
    })

    it('退会アンケートの保存に失敗してもアカウント削除は続行される', async () => {
      const input: DeleteAccountInputPort = {
        userId: 'user-123',
        password: 'password123',
        survey: {
          reason: 'not_useful' as const,
          reasonOther: undefined,
          feedback: 'エラーテスト',
          wouldRecommend: false,
        },
      }

      // 退会アンケート保存でエラーを発生させる
      const surveyError = new Error('Database error')
      mockWithdrawalSurveyRepository.create.mockRejectedValueOnce(surveyError)

      // console.errorをモック
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await useCase.deleteAccount(input)

      // エラーがログに記録されたことを確認
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save withdrawal survey:', surveyError)

      // アカウント削除は正常に実行されたことを確認
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          deletedAt: expect.any(Date),
        })
      )
      expect(mockAuthSessionRepository.deleteByUserId).toHaveBeenCalledWith('user-123')
      expect(result.message).toBe('アカウントが削除されました。')

      consoleErrorSpy.mockRestore()
    })
  })

  describe('退会アンケートがない場合', () => {
    it('退会アンケートなしでアカウント削除できる', async () => {
      const input: DeleteAccountInputPort = {
        userId: 'user-123',
        password: 'password123',
        // surveyプロパティなし
      }

      await useCase.deleteAccount(input)

      // 退会アンケートが保存されないことを確認
      expect(mockWithdrawalSurveyRepository.create).not.toHaveBeenCalled()

      // アカウント削除は実行されたことを確認
      expect(mockUserRepository.update).toHaveBeenCalled()
      expect(mockAuthSessionRepository.deleteByUserId).toHaveBeenCalledWith('user-123')
    })
  })

  describe('WithdrawalSurveyRepositoryが提供されていない場合', () => {
    beforeEach(() => {
      // WithdrawalSurveyRepositoryなしでUseCaseを再作成
      useCase = new AccountManagementUseCase(
        mockUserRepository,
        mockAuthSessionRepository,
        mockPasswordHashService,
        mockEmailService,
        undefined // withdrawalSurveyRepository を undefined に
      )
    })

    it('退会アンケートがあってもエラーにならずアカウント削除される', async () => {
      const input: DeleteAccountInputPort = {
        userId: 'user-123',
        password: 'password123',
        survey: {
          reason: 'not_useful' as const,
          reasonOther: undefined,
          feedback: 'リポジトリなしテスト',
          wouldRecommend: false,
        },
      }

      const result = await useCase.deleteAccount(input)

      // アカウント削除は正常に実行されたことを確認
      expect(mockUserRepository.update).toHaveBeenCalled()
      expect(mockAuthSessionRepository.deleteByUserId).toHaveBeenCalledWith('user-123')
      expect(result.message).toBe('アカウントが削除されました。')
    })
  })

  describe('境界値テスト', () => {
    it('フィードバックが空文字列でも保存できる', async () => {
      const input: DeleteAccountInputPort = {
        userId: 'user-123',
        password: 'password123',
        survey: {
          reason: 'not_useful' as const,
          reasonOther: undefined,
          feedback: '',
          wouldRecommend: undefined,
        },
      }

      await useCase.deleteAccount(input)

      expect(mockWithdrawalSurveyRepository.create).toHaveBeenCalledWith({
        userId: 'user-123',
        reason: 'not_useful',
        reasonOther: undefined,
        feedback: '',
        wouldRecommend: undefined,
      })
    })

    it('すべてのオプショナルフィールドがnullでも保存できる', async () => {
      const input: DeleteAccountInputPort = {
        userId: 'user-123',
        password: 'password123',
        survey: {
          reason: 'not_useful' as const,
          reasonOther: undefined,
          feedback: undefined,
          wouldRecommend: undefined,
        },
      }

      await useCase.deleteAccount(input)

      expect(mockWithdrawalSurveyRepository.create).toHaveBeenCalledWith({
        userId: 'user-123',
        reason: 'not_useful',
        reasonOther: undefined,
        feedback: undefined,
        wouldRecommend: undefined,
      })
    })
  })
})
