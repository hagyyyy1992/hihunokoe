import { GetUserUseCaseInput, GetUserUseCaseOutput } from './GetUserUseCase'

export interface GetUserInputPort {
  execute(input: GetUserUseCaseInput): Promise<GetUserUseCaseOutput>
}