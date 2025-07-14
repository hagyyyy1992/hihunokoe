import { User, UserRole } from '@api/domain/entities/User'
import { IUserRepository } from '@api/domain/repositories/UserRepository'
import { IAuthSessionRepository } from '@api/domain/repositories/AuthSessionRepository'
import { PasswordHashService } from '@api/domain/services/PasswordHashService'
import { TokenService } from '@api/domain/services/TokenService'
import { IEmailService } from '@api/domain/services/EmailService'
import { AuthSession } from '@api/domain/entities/AuthSession'
import { Email } from '@api/domain/value-objects/Email'
import { Password } from '@api/domain/value-objects/Password'
import { WithdrawalSurveyRepository } from '@api/domain/repositories/WithdrawalSurveyRepository'
import { WithdrawalReason } from '@api/domain/entities/WithdrawalSurvey'
import { getEmailBaseUrl } from '@/lib/email/utils'
import {
  InvalidCredentialsError,
  AccountLockedError,
  AccountInactiveError,
  EmailNotVerifiedError,
  TokenExpiredError,
  InvalidTokenError,
} from '@api/domain/exceptions/AuthenticationError'
import {
  IAuthenticationUseCase,
  IPasswordManagementUseCase,
  IEmailVerificationUseCase,
  IAccountManagementUseCase,
  LoginInputPort,
  RegisterInputPort,
  LogoutInputPort,
  GetCurrentUserInputPort,
  VerifyTokenInputPort,
  ForgotPasswordInputPort,
  ResetPasswordInputPort,
  VerifyPasswordResetTokenInputPort,
  VerifyEmailInputPort,
  ResendVerificationEmailInputPort,
  DeleteAccountInputPort,
} from './input-port'
import {
  LoginOutputPort,
  RegisterOutputPort,
  LogoutOutputPort,
  GetCurrentUserOutputPort,
  VerifyTokenOutputPort,
  ForgotPasswordOutputPort,
  ResetPasswordOutputPort,
  VerifyPasswordResetTokenOutputPort,
  VerifyEmailOutputPort,
  ResendVerificationEmailOutputPort,
  DeleteAccountOutputPort,
} from './output-port'

export class AuthenticationUseCase implements IAuthenticationUseCase {
  private readonly MAX_FAILED_ATTEMPTS = 5
  private readonly LOCK_TIME_MINUTES = 30

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authSessionRepository: IAuthSessionRepository,
    private readonly passwordHashService: PasswordHashService,
    private readonly tokenService: TokenService
  ) {}

  async login(input: LoginInputPort): Promise<LoginOutputPort> {
    const email = new Email(input.email)
    const password = new Password(input.password)

    const user = await this.userRepository.findByEmail(email.getValue())
    if (!user) {
      throw new InvalidCredentialsError()
    }

    // 管理者はユーザー側ログインを禁止
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      throw new InvalidCredentialsError('管理者アカウントは管理画面からログインしてください')
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AccountLockedError()
    }

    // Check if account is active
    if (!user.isActive || user.deletedAt) {
      throw new AccountInactiveError()
    }

    const isPasswordValid = await this.passwordHashService.compare(
      password.getValue(),
      user.passwordHash
    )

    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id)
      throw new InvalidCredentialsError()
    }

    if (!user.emailVerified) {
      throw new EmailNotVerifiedError()
    }

    // 初回ログイン時（利用規約・プライバシーポリシー未同意）の場合、
    // トークンは発行するがフロントエンドで同意ページへリダイレクトする
    // 注: 同意チェックはログインAPIでは行わず、別ページで行う
    const requiresTermsAgreement = !user.termsAcceptedAt || !user.privacyAcceptedAt

    await this.userRepository.resetFailedLoginAttempts(user.id)

    const token = await this.tokenService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      userName: user.userName,
      termsAcceptedAt: user.termsAcceptedAt?.toISOString() || null,
      privacyAcceptedAt: user.privacyAcceptedAt?.toISOString() || null,
    })

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const session = new AuthSession(crypto.randomUUID(), user.id, token, expiresAt, new Date())

    await this.authSessionRepository.create(session)

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        userName: user.userName,
        role: user.role,
        emailVerified: user.emailVerified,
        termsAcceptedAt: user.termsAcceptedAt,
        privacyAcceptedAt: user.privacyAcceptedAt,
      },
    }
  }

  async register(input: RegisterInputPort): Promise<RegisterOutputPort> {
    const email = new Email(input.email)
    const password = new Password(input.password)

    await this.validateUniqueConstraints(email.getValue(), input.userName)

    const passwordHash = await this.passwordHashService.hash(password.getValue())
    const emailVerificationToken = this.tokenService.generateRandomToken()

    const user = await this.userRepository.create({
      email: email.getValue(),
      username: input.userName,
      passwordHash,
      emailVerified: false,
      emailVerificationToken,
      passwordResetToken: null,
      passwordResetExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      role: UserRole.USER,
      active: true,
      deletedAt: null,
    })

    return {
      user,
      message:
        'アカウントが作成されました。メールで送信された認証リンクをクリックしてアカウントを有効化してください。',
    }
  }

  async logout(input: LogoutInputPort): Promise<LogoutOutputPort> {
    await this.authSessionRepository.deleteByToken(input.token)
    return {
      message: 'ログアウトしました',
    }
  }

  async getCurrentUser(input: GetCurrentUserInputPort): Promise<GetCurrentUserOutputPort> {
    // JWTトークンを検証
    let decoded: any
    try {
      decoded = await this.tokenService.verifyToken(input.token)
    } catch (error) {
      if (error instanceof Error && error.message === 'Token has expired') {
        throw new TokenExpiredError()
      }
      throw new InvalidTokenError()
    }

    // ユーザーを取得
    const user = await this.userRepository.findById(decoded.userId)
    if (!user || !user.active || user.deletedAt) {
      throw new AccountInactiveError()
    }

    return { user }
  }

  async verifyToken(input: VerifyTokenInputPort): Promise<VerifyTokenOutputPort> {
    try {
      const decoded = await this.tokenService.verifyToken(input.token)
      const user = await this.userRepository.findById(decoded.userId)

      if (!user || !user.active || user.deletedAt) {
        return { isValid: false }
      }

      return {
        isValid: true,
        user: {
          id: user.id,
          email: user.email,
          userName: user.userName,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      }
    } catch (error) {
      return { isValid: false }
    }
  }

  private async handleFailedLogin(userId: string): Promise<void> {
    await this.userRepository.incrementFailedLoginAttempts(userId)

    const user = await this.userRepository.findById(userId)
    if (user && user.failedLoginAttempts >= this.MAX_FAILED_ATTEMPTS) {
      const lockUntil = new Date()
      lockUntil.setMinutes(lockUntil.getMinutes() + this.LOCK_TIME_MINUTES)
      await this.userRepository.lockAccount(userId, lockUntil)
    }
  }

  private async validateUniqueConstraints(email: string, userName: string): Promise<void> {
    const existingUserByEmail = await this.userRepository.findByEmail(email)
    if (existingUserByEmail) {
      // 退会済みユーザーの場合は再登録を許可
      if (existingUserByEmail.deletedAt) {
        return
      }

      // メール未認証かつ作成から24時間以上経過している場合は再登録を許可
      if (!existingUserByEmail.emailVerified) {
        const createdAt = new Date(existingUserByEmail.createdAt)
        const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)

        if (hoursSinceCreation > 24) {
          // 古い未認証アカウントを削除
          await this.userRepository.delete(existingUserByEmail.id)
        } else {
          throw new Error(
            'このメールアドレスは既に登録されています。ログイン画面から認証メールの再送信が可能です。'
          )
        }
      } else {
        throw new Error('ユーザー名またはメールアドレスが既に使用されています')
      }
    }

    const existingUserByUserName = await this.userRepository.findByUsername(userName)
    if (existingUserByUserName) {
      // 退会済みユーザーの場合は再登録を許可
      if (existingUserByUserName.deletedAt) {
        return
      }

      // ユーザー名も同様にチェック
      if (!existingUserByUserName.emailVerified) {
        const createdAt = new Date(existingUserByUserName.createdAt)
        const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)

        if (hoursSinceCreation > 24) {
          // 古い未認証アカウントを削除
          await this.userRepository.delete(existingUserByUserName.id)
        } else {
          throw new Error('このユーザー名は既に使用されています。別のユーザー名をお試しください。')
        }
      } else {
        throw new Error('ユーザー名またはメールアドレスが既に使用されています')
      }
    }
  }
}

export class PasswordManagementUseCase implements IPasswordManagementUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHashService: PasswordHashService,
    private readonly tokenService: TokenService,
    private readonly emailService?: IEmailService
  ) {}

  async forgotPassword(input: ForgotPasswordInputPort): Promise<ForgotPasswordOutputPort> {
    const email = new Email(input.email)
    const user = await this.userRepository.findByEmail(email.getValue())

    // セキュリティのため、ユーザーが存在しない場合でも成功レスポンスを返す
    if (!user) {
      return {
        message: 'パスワードリセットのメールを送信しました。メールをご確認ください。',
      }
    }

    // アカウントが無効な場合はエラーを返す
    if (!user.isActive || user.deletedAt) {
      throw new AccountInactiveError()
    }

    const resetToken = this.tokenService.generateRandomToken()
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1時間後

    await this.userRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    })

    // Send password reset email
    if (this.emailService) {
      const baseUrl = getEmailBaseUrl()
      await this.emailService.sendPasswordResetEmail(user.email, user.userName, resetToken, baseUrl)
    }

    return {
      message: 'パスワードリセットのメールを送信しました。メールをご確認ください。',
    }
  }

  async resetPassword(input: ResetPasswordInputPort): Promise<ResetPasswordOutputPort> {
    const password = new Password(input.newPassword)

    const user = await this.userRepository.findByPasswordResetToken(input.token)
    if (!user) {
      throw new InvalidTokenError()
    }

    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new TokenExpiredError()
    }

    const passwordHash = await this.passwordHashService.hash(password.getValue())

    await this.userRepository.update(user.id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    })

    return {
      message: 'パスワードがリセットされました。新しいパスワードでログインしてください。',
    }
  }

  async verifyPasswordResetToken(
    input: VerifyPasswordResetTokenInputPort
  ): Promise<VerifyPasswordResetTokenOutputPort> {
    const user = await this.userRepository.findByPasswordResetToken(input.token)

    if (!user) {
      return { isValid: false }
    }

    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return { isValid: false }
    }

    return {
      isValid: true,
      email: user.email,
    }
  }
}

export class EmailVerificationUseCase implements IEmailVerificationUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: TokenService,
    private readonly emailService?: IEmailService
  ) {}

  async verifyEmail(input: VerifyEmailInputPort): Promise<VerifyEmailOutputPort> {
    const user = await this.userRepository.findByEmailVerificationToken(input.token)
    if (!user) {
      throw new InvalidTokenError()
    }

    if (user.emailVerified) {
      throw new Error('このアカウントは既に認証済みです')
    }

    const updatedUser = await this.userRepository.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
    })

    return {
      user: updatedUser,
      message: 'メールアドレスが認証されました。ログインできます。',
    }
  }

  async resendVerificationEmail(
    input: ResendVerificationEmailInputPort
  ): Promise<ResendVerificationEmailOutputPort> {
    const email = new Email(input.email)
    const user = await this.userRepository.findByEmail(email.getValue())

    if (!user) {
      // セキュリティのため、ユーザーが存在しない場合でも成功レスポンスを返す
      return {
        message: '認証メールを再送信しました。メールをご確認ください。',
      }
    }

    if (user.emailVerified) {
      return {
        message: 'このアカウントは既に認証済みです。',
      }
    }

    const newVerificationToken = this.tokenService.generateRandomToken()
    await this.userRepository.update(user.id, {
      emailVerificationToken: newVerificationToken,
    })

    // Send verification email
    if (this.emailService) {
      const baseUrl = getEmailBaseUrl()
      await this.emailService.sendVerificationEmail(
        user.email,
        user.userName,
        newVerificationToken,
        baseUrl
      )
    }

    return {
      message: '認証メールを再送信しました。メールをご確認ください。',
    }
  }
}

export class AccountManagementUseCase implements IAccountManagementUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authSessionRepository: IAuthSessionRepository,
    private readonly passwordHashService: PasswordHashService,
    private readonly emailService: IEmailService,
    private readonly withdrawalSurveyRepository?: WithdrawalSurveyRepository
  ) {}

  async deleteAccount(input: DeleteAccountInputPort): Promise<DeleteAccountOutputPort> {
    const user = await this.userRepository.findById(input.userId)
    if (!user) {
      throw new Error('ユーザーが見つかりません')
    }

    if (!user.isActive || user.deletedAt) {
      throw new AccountInactiveError()
    }

    // Verify password
    const isPasswordValid = await this.passwordHashService.compare(
      input.password,
      user.passwordHash
    )
    if (!isPasswordValid) {
      throw new InvalidCredentialsError('パスワードが正しくありません')
    }

    // Save withdrawal survey if provided
    if (input.survey && this.withdrawalSurveyRepository) {
      try {
        await this.withdrawalSurveyRepository.create({
          userId: input.userId,
          reason: input.survey.reason as WithdrawalReason,
          reasonOther: input.survey.reasonOther,
          feedback: input.survey.feedback,
          wouldRecommend: input.survey.wouldRecommend,
        })
      } catch (error) {
        // アンケート保存に失敗してもアカウント削除は続行
        console.error('Failed to save withdrawal survey:', error)
      }
    }

    // Soft delete the user
    await this.userRepository.update(input.userId, {
      deletedAt: new Date(),
      active: false,
    })

    // Delete all sessions
    await this.authSessionRepository.deleteByUserId(input.userId)

    // Send account deletion confirmation email
    try {
      await this.emailService.sendAccountDeletionEmail(user.email, user.userName)
    } catch (error) {
      // メール送信に失敗してもアカウント削除は完了とする
      console.error('Failed to send account deletion email:', error)
    }

    return {
      message: 'アカウントが削除されました。',
    }
  }
}
