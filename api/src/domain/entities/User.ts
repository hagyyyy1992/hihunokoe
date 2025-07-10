export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly username: string,
    public readonly userName: string, // Alias for compatibility
    public readonly passwordHash: string,
    public readonly displayName: string | null,
    public readonly profileImageUrl: string | null,
    public readonly birthDate: Date | null,
    public readonly gender: string | null,
    public readonly skinType: string | null,
    public readonly skinTypeOther: string | null,
    public readonly allergies: string[] | null,
    public readonly allergiesOther: string | null,
    public readonly emailVerified: boolean,
    public readonly emailVerificationToken: string | null,
    public readonly passwordResetToken: string | null,
    public readonly passwordResetExpires: Date | null,
    public readonly failedLoginAttempts: number,
    public readonly lockedUntil: Date | null,
    public readonly role: UserRole,
    public readonly active: boolean,
    public readonly isActive: boolean, // Alias for compatibility
    public readonly deletedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly password?: string, // For compatibility with some tests (moved to end)
    // Additional properties for test compatibility
    public readonly bio?: string | null,
    public readonly favoriteCategories?: string[] | null
  ) {
    // Set aliases for compatibility
    this.userName = this.username
    this.isActive = this.active
  }

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
