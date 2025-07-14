import { GetUserInteractor } from '@api/usecases/user/interactor'
import { IUserRepository } from '@api/domain/repositories/UserRepository'
import { User, UserRole } from '@api/domain/entities/User'

// Create a mock repository that implements all required methods
class MockUserRepository implements IUserRepository {
  findById = jest.fn()
  findByEmail = jest.fn()
  findByUsername = jest.fn()
  findByEmailIncludingDeleted = jest.fn()
  findByUsernameIncludingDeleted = jest.fn()
  findByEmailVerificationToken = jest.fn()
  findByPasswordResetToken = jest.fn()
  findMany = jest.fn()
  create = jest.fn()
  update = jest.fn()
  delete = jest.fn()
  softDelete = jest.fn()
  incrementFailedLoginAttempts = jest.fn()
  resetFailedLoginAttempts = jest.fn()
  lockAccount = jest.fn()
  updatePassword = jest.fn()
  verifyEmail = jest.fn()
}

describe('GetUserUseCase', () => {
  let useCase: GetUserInteractor
  let mockUserRepository: MockUserRepository

  beforeEach(() => {
    mockUserRepository = new MockUserRepository()
    useCase = new GetUserInteractor(mockUserRepository)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return user when found', async () => {
    const mockUser = new User(
      '1',
      'test@example.com',
      'testuser',
      'testuser',
      'hashedPassword',
      null, // displayName
      null, // profileImageUrl
      null, // birthDate
      null, // gender
      null, // skinType
      null, // skinTypeOther
      null, // allergies
      null, // allergiesOther
      true, // emailVerified
      null, // emailVerificationToken
      null, // passwordResetToken
      null, // passwordResetExpires
      0, // failedLoginAttempts
      null, // lockedUntil
      UserRole.USER,
      true, // active
      true, // isActive
      null, // deletedAt
      new Date(),
      new Date(),
      null, // termsAcceptedAt
      null, // privacyAcceptedAt
      undefined // password
    )

    mockUserRepository.findById.mockResolvedValue(mockUser)

    const result = await useCase.execute({ userId: '1' })

    expect(result.user).toEqual(mockUser)
    expect(mockUserRepository.findById).toHaveBeenCalledWith('1')
  })

  it('should throw error when user not found', async () => {
    mockUserRepository.findById.mockResolvedValue(null)

    await expect(useCase.execute({ userId: 'non-existent' })).rejects.toThrow(
      'ユーザーが見つかりません'
    )
    expect(mockUserRepository.findById).toHaveBeenCalledWith('non-existent')
  })
})
