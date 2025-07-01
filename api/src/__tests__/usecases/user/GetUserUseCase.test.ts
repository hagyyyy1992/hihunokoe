import { GetUserUseCase } from '@api/usecases/user/GetUserUseCase'
import { UserRepository } from '@api/domain/repositories/UserRepository'
import { User } from '@api/domain/entities/User'

class MockUserRepository implements UserRepository {
  private users: User[] = []

  setUsers(users: User[]) {
    this.users = users
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null
  }
}

describe('GetUserUseCase', () => {
  let getUserUseCase: GetUserUseCase
  let mockUserRepository: MockUserRepository

  beforeEach(() => {
    mockUserRepository = new MockUserRepository()
    getUserUseCase = new GetUserUseCase(mockUserRepository)
  })

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

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
      const unverifiedUser = { ...mockUser, emailVerified: false }
      mockUserRepository.setUsers([unverifiedUser])

      await expect(getUserUseCase.execute({ userId: '1' })).rejects.toThrow(
        'メールアドレスの確認が必要です'
      )
    })
  })
})
