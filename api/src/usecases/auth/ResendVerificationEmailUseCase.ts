import { UserRepository } from '@api/domain/repositories/UserRepository'
import { EmailService } from '@api/domain/services/EmailService'
import { TokenService } from '@api/domain/services/TokenService'

export interface ResendVerificationEmailInput {
  email: string
  baseUrl?: string
}

export interface ResendVerificationEmailOutput {
  success: boolean
  message: string
}

export class ResendVerificationEmailUseCase {
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService,
    private tokenService: TokenService
  ) {}

  async execute(input: ResendVerificationEmailInput): Promise<ResendVerificationEmailOutput> {
    // ユーザーの存在確認
    const user = await this.userRepository.findByEmail(input.email)
    if (!user) {
      return {
        success: false,
        message: 'このメールアドレスは登録されていません',
      }
    }

    // 既に確認済みの場合
    if (user.emailVerified) {
      return {
        success: false,
        message: 'このメールアドレスは既に確認済みです',
      }
    }

    // 新しい確認トークンを生成
    const verificationToken = await this.tokenService.generateEmailVerificationToken(user.id)

    // トークンをユーザーに保存
    await this.userRepository.update(user.id, {
      emailVerificationToken: verificationToken,
    })

    // 確認メールを送信
    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        user.displayName || user.userName,
        verificationToken,
        input.baseUrl
      )

      return {
        success: true,
        message: '確認メールを再送信しました',
      }
    } catch (error) {
      console.error('Failed to send verification email:', error)
      return {
        success: false,
        message: '確認メールの送信に失敗しました',
      }
    }
  }
}
