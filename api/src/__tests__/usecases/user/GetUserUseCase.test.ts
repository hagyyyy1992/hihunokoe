import { GetUserInteractor } from '@api/usecases/user/interactor'
import {
  UserRepository,
  CreateUserData,
  UpdateUserData,
} from '@api/domain/repositories/UserRepository'
import { User, UserRole } from '@api/domain/entities/User'

class MockUserRepository implements UserRepository {
  private users: User[] = []

  setUsers(users: User[]) {
    this.users = users
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) || null
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.users.find(user => user.username === username) || null
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    return this.users.find(user => user.emailVerificationToken === token) || null
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.users.find(user => user.passwordResetToken === token) || null
  }

  async create(user: CreateUserData): Promise<User> {
    const newUser = new User(
      'new-id',
      user.email,
      user.username,
      user.passwordHash,
      user.emailVerified,
      user.emailVerificationToken,
      user.passwordResetToken,
      user.passwordResetExpires,
      user.failedLoginAttempts,
      user.lockedUntil,
      user.role,
      user.active,
      user.deletedAt,
      new Date(),
      new Date()
    )
    this.users.push(newUser)
    return newUser
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const user = this.users.find(u => u.id === id)
    if (!user) throw new Error('User not found')
    return user
  }

  async delete(id: string): Promise<void> {
    this.users = this.users.filter(u => u.id !== id)
  }

  async incrementFailedLoginAttempts(id: string): Promise<void> {}
  async resetFailedLoginAttempts(id: string): Promise<void> {}
  async lockAccount(id: string, until: Date): Promise<void> {}
}

describe('GetUserUseCase', () => {
  let getUserUseCase: GetUserInteractor
  let mockUserRepository: MockUserRepository

  beforeEach(() => {
    mockUserRepository = new MockUserRepository()
    getUserUseCase = new GetUserInteractor(mockUserRepository)
  })

  const mockUser: User = new User(
    '1',
    'test@example.com',
    'testuser',
    'hashed-password',
    true,
    null,
    null,
    null,
    0,
    null,
    UserRole.USER,
    true,
    null,
    new Date(),
    new Date()
  )

  describe('execute', () => {
    it('should return user when user exists and email is verified', async () => {
      mockUserRepository.setUsers([mockUser])

      const result = await getUserUseCase.execute({ userId: '1' })

      expect(result.user).toEqual(mockUser)
    })

    it('should throw error when user does not exist', async () => {
      mockUserRepository.setUsers([])

      await expect(getUserUseCase.execute({ userId: '999' })).rejects.toThrow(
        'ユーザーが見つかりません'
      )
    })

    it('should throw error when user email is not verified', async () => {
      const unverifiedUser = new User(
        mockUser.id,
        mockUser.email,
        mockUser.username,
        mockUser.passwordHash,
        false, // emailVerified
        mockUser.emailVerificationToken,
        mockUser.passwordResetToken,
        mockUser.passwordResetExpires,
        mockUser.failedLoginAttempts,
        mockUser.lockedUntil,
        mockUser.role,
        mockUser.active,
        mockUser.deletedAt,
        mockUser.createdAt,
        mockUser.updatedAt
      )
      mockUserRepository.setUsers([unverifiedUser])

      await expect(getUserUseCase.execute({ userId: '1' })).rejects.toThrow(
        'メールアドレスの確認が必要です'
      )
    })
  })
})
