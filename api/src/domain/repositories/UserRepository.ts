import { User, UserRole } from '@api/domain/entities/User'

export interface CreateUserData {
  email: string
  username: string
  passwordHash: string
  emailVerified: boolean
  emailVerificationToken: string | null
  passwordResetToken: string | null
  passwordResetExpires: Date | null
  failedLoginAttempts: number
  lockedUntil: Date | null
  role: UserRole
  active: boolean
  deletedAt: Date | null
}

export interface UpdateUserData {
  email?: string
  username?: string
  passwordHash?: string
  emailVerified?: boolean
  emailVerificationToken?: string | null
  passwordResetToken?: string | null
  passwordResetExpires?: Date | null
  failedLoginAttempts?: number
  lockedUntil?: Date | null
  role?: UserRole
  active?: boolean
  deletedAt?: Date | null
}

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByUsername(username: string): Promise<User | null>
  findByEmailVerificationToken(token: string): Promise<User | null>
  findByPasswordResetToken(token: string): Promise<User | null>
  create(user: CreateUserData): Promise<User>
  update(id: string, data: UpdateUserData): Promise<User>
  delete(id: string): Promise<void>
  incrementFailedLoginAttempts(id: string): Promise<void>
  resetFailedLoginAttempts(id: string): Promise<void>
  lockAccount(id: string, until: Date): Promise<void>
}
