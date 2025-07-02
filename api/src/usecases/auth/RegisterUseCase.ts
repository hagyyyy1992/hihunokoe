import { RegisterInputPort, RegisterInput, RegisterOutput } from '@api/usecases/auth/RegisterInputPort'
import { UserRepository } from '@api/domain/repositories/UserRepository'
import { PasswordHashService } from '@api/domain/services/PasswordHashService'
import { TokenService } from '@api/domain/services/TokenService'
import { Email } from '@api/domain/value-objects/Email'
import { Password } from '@api/domain/value-objects/Password'
import { UserRole } from '@api/domain/entities/User'

export class RegisterUseCase implements RegisterInputPort {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHashService: PasswordHashService,
    private readonly tokenService: TokenService
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
      deletedAt: null
    })

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      emailVerificationToken: emailVerificationToken
    }
  }

  private async validateUniqueConstraints(email: string, username: string): Promise<void> {
    const existingUserByEmail = await this.userRepository.findByEmail(email)
    if (existingUserByEmail) {
      throw new Error('Email already exists')
    }

    const existingUserByUsername = await this.userRepository.findByUsername(username)
    if (existingUserByUsername) {
      throw new Error('Username already exists')
    }
  }
}