import { User } from '@api/domain/entities/User'

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByUsername(username: string): Promise<User | null>
  findByEmailVerificationToken(token: string): Promise<User | null>
  findByPasswordResetToken(token: string): Promise<User | null>
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>
  update(id: string, data: Partial<User>): Promise<User>
  delete(id: string): Promise<void>
  incrementFailedLoginAttempts(id: string): Promise<void>
  resetFailedLoginAttempts(id: string): Promise<void>
  lockAccount(id: string, until: Date): Promise<void>
}
