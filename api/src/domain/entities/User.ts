export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly username: string,
    public readonly passwordHash: string,
    public readonly emailVerified: boolean,
    public readonly emailVerificationToken: string | null,
    public readonly passwordResetToken: string | null,
    public readonly passwordResetExpires: Date | null,
    public readonly failedLoginAttempts: number,
    public readonly lockedUntil: Date | null,
    public readonly role: UserRole,
    public readonly active: boolean,
    public readonly deletedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  isLocked(): boolean {
    return this.lockedUntil !== null && this.lockedUntil > new Date()
  }

  canLogin(): boolean {
    return this.active && !this.isLocked() && !this.deletedAt
  }

  isDeleted(): boolean {
    return this.deletedAt !== null
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN || this.role === UserRole.SUPER_ADMIN
  }

  isSuperAdmin(): boolean {
    return this.role === UserRole.SUPER_ADMIN
  }
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}
