import { GetUserUseCaseOutput } from './output-port'

export abstract class IGetUserInputPort {
  abstract execute(inputPort: GetUserUseCaseInput): Promise<GetUserUseCaseOutput>
}

export type GetUserUseCaseInput = {
  userId: string
}
