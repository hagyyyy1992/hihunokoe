import { GetUserUseCase } from '@api/usecases/user/GetUserUseCase'
import { UserRepositoryImpl } from '@api/interface-adapters/repositories/UserRepositoryImpl'
import { GraphQLContext } from '@/graphql/context'

export class GraphQLUserController {
  private userRepository: UserRepositoryImpl

  constructor() {
    this.userRepository = new UserRepositoryImpl()
  }

  async getUser(args: { id: string }, context: GraphQLContext) {
    const getUserUseCase = new GetUserUseCase(this.userRepository)

    try {
      const { user } = await getUserUseCase.execute({
        id: args.id,
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

    const getUserUseCase = new GetUserUseCase(this.userRepository)

    try {
      const { user } = await getUserUseCase.execute({
        id: context.userId,
      })

      return user
    } catch (error) {
      return null
    }
  }
}
