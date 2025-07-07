import { LoginInputPort, LoginInput, LoginOutput } from '@api/usecases/auth/LoginInputPort'
import { UserRepository } from '@api/domain/repositories/UserRepository'
import { AuthSessionRepository } from '@api/domain/repositories/AuthSessionRepository'
import { PasswordHashService } from '@api/domain/services/PasswordHashService'
import { TokenService } from '@api/domain/services/TokenService'
import { AuthSession } from '@api/domain/entities/AuthSession'
import { Email } from '@api/domain/value-objects/Email'
import { Password } from '@api/domain/value-objects/Password'
import {
  InvalidCredentialsError,
  AccountLockedError,
  AccountInactiveError,
  EmailNotVerifiedError,
} from '@api/domain/exceptions/AuthenticationError'

export class LoginUseCase implements LoginInputPort {
  private readonly MAX_FAILED_ATTEMPTS = 5
  private readonly LOCK_TIME_MINUTES = 30

  constructor(
    private readonly userRepository: UserRepository,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly passwordHashService: PasswordHashService,
    private readonly tokenService: TokenService
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const email = new Email(input.email)
    const password = new Password(input.password)

    const user = await this.userRepository.findByEmail(email.getValue())
    if (!user) {
      throw new InvalidCredentialsError()
    }

    if (!user.canLogin()) {
      if (user.isLocked()) {
        throw new AccountLockedError()
      }
      if (!user.active || user.isDeleted()) {
        throw new AccountInactiveError()
      }
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

    await this.userRepository.resetFailedLoginAttempts(user.id)

    const token = await this.tokenService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
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
        username: user.username,
        role: user.role,
        emailVerified: user.emailVerified,
      },
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
}
