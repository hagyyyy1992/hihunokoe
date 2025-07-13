import { AdminUser } from '@api/domain/entities/AdminUser'

export interface AdminUserRepository {
  findById(id: string): Promise<AdminUser | null>
  findByEmail(email: string): Promise<AdminUser | null>
  findByAdminName(adminName: string): Promise<AdminUser | null>
  findAll(): Promise<AdminUser[]>
  create(data: {
    adminName: string
    email: string
    passwordHash: string
    role: 'ADMIN' | 'SUPER_ADMIN'
    isActive?: boolean
    createdBy?: string
  }): Promise<AdminUser>
  update(
    id: string,
    data: {
      adminName?: string
      email?: string
      passwordHash?: string
      role?: 'ADMIN' | 'SUPER_ADMIN'
      isActive?: boolean
      lastLoginAt?: Date
      failedLoginAttempts?: number
      lockedUntil?: Date | null
      permissions?: any
    }
  ): Promise<AdminUser>
  delete(id: string): Promise<void>
  incrementLoginCount(id: string): Promise<void>
  incrementFailedLoginAttempts(id: string): Promise<void>
  resetFailedLoginAttempts(id: string): Promise<void>
  lockAccount(id: string, until: Date): Promise<void>
  unlockAccount(id: string): Promise<void>
}
