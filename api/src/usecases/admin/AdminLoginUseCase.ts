import { User, UserRole } from '@api/domain/entities/User'
import { UserRepository } from '@api/domain/repositories/UserRepository'
import { AuthSessionRepository } from '@api/domain/repositories/AuthSessionRepository'
import { PasswordHashService } from '@api/domain/services/PasswordHashService'
import { TokenService } from '@api/domain/services/TokenService'
import { AuthSession } from '@api/domain/entities/AuthSession'
import { AdminLogRepository } from '@api/domain/repositories/AdminLogRepository'
import {
  InvalidCredentialsError,
  AccountLockedError,
  AccountInactiveError,
  EmailNotVerifiedError,
} from '@api/domain/exceptions/AuthenticationError'

export interface AdminLoginInputData {
  email: string
  password: string
  ipAddress?: string
  userAgent?: string
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
    private tokenService: TokenService,
    private adminLogRepository: AdminLogRepository
  ) {}

  async execute(inputData: AdminLoginInputData): Promise<AdminLoginOutputData> {
    const { email, password } = inputData

    // Find user by email
    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      throw new InvalidCredentialsError()
    }

    // Check if user is an admin
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new InvalidCredentialsError()
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AccountLockedError()
    }

    // Check if account is active
    if (!user.isActive || user.deletedAt) {
      throw new AccountInactiveError()
    }

    // Check if email is verified (optional for admins, but recommended)
    if (!user.emailVerified) {
      throw new EmailNotVerifiedError()
    }

    // Verify password
    const isPasswordValid = await this.passwordHashService.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      // Increment failed login attempts
      await this.userRepository.incrementFailedLoginAttempts(user.id)

      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts + 1 >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        await this.userRepository.lockAccount(user.id, lockUntil)
        throw new AccountLockedError()
      }

      throw new InvalidCredentialsError()
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
      new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours for admin sessions
      new Date()
    )
    await this.authSessionRepository.create(session)

    // Log admin login action (skip for now due to foreign key constraint)
    // TODO: Implement proper admin logging after AdminUser table migration
    // Temporarily disabled due to foreign key constraint issue
    // AdminLog requires adminUserId to exist in AdminUser table
    // but we're using User table for authentication
    /*
    try {
      await this.adminLogRepository.create({
        adminUserId: user.id,
        action: 'ADMIN_LOGIN',
        details: { email: user.email },
        ipAddress: inputData.ipAddress,
        userAgent: inputData.userAgent,
      })
    } catch (error) {
      // Log the error but don't fail the login process
      console.warn('Failed to create admin log:', error)
    }
    */

    return {
      token,
      user,
    }
  }
}
