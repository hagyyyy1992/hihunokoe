import { GetUserInteractor } from '@api/usecases/user/interactor'
import { UserRepositoryImpl } from '@api/interface-adapters/repositories/UserRepositoryImpl'
import { GraphQLContext } from '@/graphql/context'

export class GraphQLUserController {
  private userRepository: UserRepositoryImpl

  constructor() {
    this.userRepository = new UserRepositoryImpl()
  }

  async getUser(args: { id: string }, context: GraphQLContext) {
    const getUserUseCase = new GetUserInteractor(this.userRepository)

    try {
      const { user } = await getUserUseCase.execute({
        userId: args.id,
      })

      return user
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async getCurrentUser(context: GraphQLContext) {
    if (!context.userId) {
      return null
    }

    const getUserUseCase = new GetUserInteractor(this.userRepository)

    try {
      const { user } = await getUserUseCase.execute({
        userId: context.userId,
      })

      return user
    } catch (error) {
      return null
    }
  }
}
