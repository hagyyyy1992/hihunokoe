export interface AdminUser {
  id: string
  adminName: string
  email: string
  passwordHash: string
  role: 'ADMIN' | 'SUPER_ADMIN'
  isActive: boolean
  lastLoginAt: Date | null
  failedLoginAttempts: number
  lockedUntil: Date | null
  permissions: any | null
  createdAt: Date
  updatedAt: Date
  createdBy: string | null
}
