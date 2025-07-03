import { UserRepository } from '@api/domain/repositories/UserRepository'
import { IGetUserInputPort } from './input-port'
import { GetUserUseCaseOutput } from './output-port'

export interface GetUserUseCaseInput {
  userId: string
}

export class GetUserInteractor implements IGetUserInputPort {
  constructor(private userRepository: UserRepository) {}

  async execute(inputPort: GetUserUseCaseInput): Promise<GetUserUseCaseOutput> {
    const user = await this.userRepository.findById(inputPort.userId)
    if (!user) throw new Error('ユーザーが見つかりません')
    if (!user.emailVerified) throw new Error('メールアドレスの確認が必要です')
    return { user }
  }
}
