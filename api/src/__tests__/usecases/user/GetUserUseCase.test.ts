import { GetUserUseCase } from '@api/usecases/user/interactor'
import { UserRepository } from '@api/domain/repositories/UserRepository'
import { User, UserRole } from '@api/domain/entities/User'

// Create a mock repository that implements all required methods
class MockUserRepository implements UserRepository {
  findById = jest.fn()
  findByEmail = jest.fn()
  findByUsername = jest.fn()
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
  let useCase: GetUserUseCase
  let mockUserRepository: MockUserRepository

  beforeEach(() => {
    mockUserRepository = new MockUserRepository()
    useCase = new GetUserUseCase(mockUserRepository)
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
      undefined // password
    )

    mockUserRepository.findById.mockResolvedValue(mockUser)

    const result = await useCase.execute({ id: '1' })

    expect(result.user).toEqual(mockUser)
    expect(mockUserRepository.findById).toHaveBeenCalledWith('1')
  })

  it('should return null when user not found', async () => {
    mockUserRepository.findById.mockResolvedValue(null)

    const result = await useCase.execute({ id: 'non-existent' })

    expect(result.user).toBeNull()
    expect(mockUserRepository.findById).toHaveBeenCalledWith('non-existent')
  })
})