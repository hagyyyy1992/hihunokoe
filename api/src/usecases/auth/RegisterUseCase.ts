import {
  RegisterInputPort,
  RegisterInput,
  RegisterOutput,
} from '@api/usecases/auth/RegisterInputPort'
import { UserRepository } from '@api/domain/repositories/UserRepository'
import { PasswordHashService } from '@api/domain/services/PasswordHashService'
import { TokenService } from '@api/domain/services/TokenService'
import { EmailService } from '@api/domain/services/EmailService'
import { Email } from '@api/domain/value-objects/Email'
import { Password } from '@api/domain/value-objects/Password'
import { UserRole } from '@api/domain/entities/User'

export class RegisterUseCase implements RegisterInputPort {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHashService: PasswordHashService,
    private readonly tokenService: TokenService,
    private readonly emailService?: EmailService
  ) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    const email = new Email(input.email)
    const password = new Password(input.password)

    await this.validateUniqueConstraints(email.getValue(), input.username)

    const passwordHash = await this.passwordHashService.hash(password.getValue())
    const emailVerificationToken = this.tokenService.generateRandomToken()

    const user = await this.userRepository.create({
      email: email.getValue(),
      username: input.username,
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

    // Send verification email
    if (this.emailService) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      await this.emailService.sendVerificationEmail(
        user.email,
        user.username,
        emailVerificationToken,
        baseUrl
      )
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      emailVerificationToken: emailVerificationToken,
    }
  }

  private async validateUniqueConstraints(email: string, username: string): Promise<void> {
    const existingUserByEmail = await this.userRepository.findByEmail(email)
    if (existingUserByEmail) {
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

    const existingUserByUsername = await this.userRepository.findByUsername(username)
    if (existingUserByUsername) {
      // ユーザー名も同様にチェック
      if (!existingUserByUsername.emailVerified) {
        const createdAt = new Date(existingUserByUsername.createdAt)
        const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)

        if (hoursSinceCreation > 24) {
          // 古い未認証アカウントを削除
          await this.userRepository.delete(existingUserByUsername.id)
        } else {
          throw new Error('このユーザー名は既に使用されています。別のユーザー名をお試しください。')
        }
      } else {
        throw new Error('ユーザー名またはメールアドレスが既に使用されています')
      }
    }
  }
}
