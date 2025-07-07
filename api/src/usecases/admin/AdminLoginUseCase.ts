import { User, UserRole } from '@api/domain/entities/User'
import { UserRepository } from '@api/domain/repositories/UserRepository'
import { AuthSessionRepository } from '@api/domain/repositories/AuthSessionRepository'
import { PasswordHashService } from '@api/domain/services/PasswordHashService'
import { TokenService } from '@api/domain/services/TokenService'
import { AuthSession } from '@api/domain/entities/AuthSession'
import {
  InvalidCredentialsError,
  AccountLockedError,
  AccountInactiveError,
  EmailNotVerifiedError,
} from '@api/domain/exceptions/AuthenticationError'

export interface AdminLoginInputData {
  email: string
  password: string
}

export interface AdminLoginOutputData {
  token: string
  user: User
}

export class AdminLoginUseCase {
  constructor(
    private userRepository: UserRepository,
    private authSessionRepository: AuthSessionRepository,
    private passwordHashService: PasswordHashService,
    private tokenService: TokenService
  ) {}

  async execute(inputData: AdminLoginInputData): Promise<AdminLoginOutputData> {
    const { email, password } = inputData

    // Find user by email
    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      throw new InvalidCredentialsError('Invalid email or password')
    }

    // Check if user is an admin
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new InvalidCredentialsError('Access denied: Admin privileges required')
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AccountLockedError('Account is temporarily locked')
    }

    // Check if account is active
    if (!user.isActive || user.deletedAt) {
      throw new AccountInactiveError('Account is inactive')
    }

    // Check if email is verified (optional for admins, but recommended)
    if (!user.emailVerified) {
      throw new EmailNotVerifiedError('Email verification required')
    }

    // Verify password
    const isPasswordValid = await this.passwordHashService.compare(password, user.password)
    if (!isPasswordValid) {
      // Increment failed login attempts
      await this.userRepository.incrementFailedLoginAttempts(user.id)

      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts + 1 >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        await this.userRepository.lockAccount(user.id, lockUntil)
        throw new AccountLockedError('Account locked due to too many failed attempts')
      }

      throw new InvalidCredentialsError('Invalid email or password')
    }

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await this.userRepository.resetFailedLoginAttempts(user.id)
    }

    // Generate token
    const token = await this.tokenService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      userName: user.userName,
    })

    // Create session
    const session = new AuthSession(
      crypto.randomUUID(),
      user.id,
      token,
      new Date(),
      new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours for admin sessions
      true
    )
    await this.authSessionRepository.create(session)

    return {
      token,
      user,
    }
  }
}
