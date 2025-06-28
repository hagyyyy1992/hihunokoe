import { User } from '../../domain/entities/User'
import { UserRepository } from '../../domain/repositories/UserRepository'

export interface GetUserUseCaseInput {
  userId: string
}

export interface GetUserUseCaseOutput {
  user: User
}

export class GetUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(input: GetUserUseCaseInput): Promise<GetUserUseCaseOutput> {
    console.log('[UseCase] GetUserUseCase.execute called', { userId: input.userId })

    const user = await this.userRepository.findById(input.userId)
    console.log('[UseCase] User fetched from repository', {
      user: user ? { id: user.id, email: user.email } : null,
    })

    if (!user) {
      console.log('[UseCase] User not found, throwing error')
      throw new Error('ユーザーが見つかりません')
    }

    if (!user.emailVerified) {
      console.log('[UseCase] Email not verified, throwing error')
      throw new Error('メールアドレスの確認が必要です')
    }

    console.log('[UseCase] User validation passed, returning user')
    return { user }
  }
}
