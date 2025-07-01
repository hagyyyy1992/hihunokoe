import { User } from '@api/domain/entities/User'
import { UserRepository } from '@api/domain/repositories/UserRepository'
import { GetUserInputPort } from './GetUserInputPort'

export interface GetUserUseCaseInput {
  userId: string
}

export interface GetUserUseCaseOutput {
  user: User
}

export class GetUserUseCase implements GetUserInputPort {
  constructor(private userRepository: UserRepository) {}

  async execute(input: GetUserUseCaseInput): Promise<GetUserUseCaseOutput> {
    const user = await this.userRepository.findById(input.userId)
    if (!user) throw new Error('ユーザーが見つかりません')
    if (!user.emailVerified) throw new Error('メールアドレスの確認が必要です')
    return { user }
  }
}
