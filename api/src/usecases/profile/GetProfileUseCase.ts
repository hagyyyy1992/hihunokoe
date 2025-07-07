import { User } from '@api/domain/entities/User'
import { UserRepository } from '@api/domain/repositories/UserRepository'

export interface GetProfileInputData {
  userId: string
}

export interface GetProfileOutputData {
  user: User
}

export class GetProfileUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(inputData: GetProfileInputData): Promise<GetProfileOutputData> {
    const { userId } = inputData

    // Get user profile
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    if (!user.isActive || user.deletedAt) {
      throw new Error('User account is inactive')
    }

    return { user }
  }
}
