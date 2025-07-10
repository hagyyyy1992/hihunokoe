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
  // プロフィールフィールド
  skinType?: string | null
  birthDate?: Date | null
  gender?: string | null
  allergies?: string[] | null
  allergiesOther?: string | null
  userName?: string
}

export interface FindUsersFilter {
  offset: number
  limit: number
  search?: string
  activeOnly?: boolean
  inactiveOnly?: boolean
  role?: string
  createdAfter?: Date
}

export interface FindUsersResult {
  users: User[]
  totalCount: number
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByUsername(username: string): Promise<User | null>
  findByEmailVerificationToken(token: string): Promise<User | null>
  findByPasswordResetToken(token: string): Promise<User | null>
  findMany(filter: FindUsersFilter): Promise<FindUsersResult>
  create(user: CreateUserData): Promise<User>
  update(id: string, data: UpdateUserData): Promise<User>
  delete(id: string): Promise<void>
  softDelete(id: string): Promise<void>
  incrementFailedLoginAttempts(id: string): Promise<void>
  resetFailedLoginAttempts(id: string): Promise<void>
  lockAccount(id: string, until: Date): Promise<void>
  updatePassword(id: string, passwordHash: string): Promise<void>
  verifyEmail(id: string): Promise<void>
}
