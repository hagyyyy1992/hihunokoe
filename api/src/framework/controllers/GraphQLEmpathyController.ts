import { AddEmpathyUseCase } from '@api/usecases/posts/AddEmpathyUseCase'
import { RemoveEmpathyUseCase } from '@api/usecases/posts/RemoveEmpathyUseCase'
import { EmpathyRepositoryImpl } from '@api/interface-adapters/repositories/EmpathyRepositoryImpl'
import { PostRepositoryImpl } from '@api/interface-adapters/repositories/PostRepositoryImpl'
import { UserRepositoryImpl } from '@api/interface-adapters/repositories/UserRepositoryImpl'
import { GraphQLContext } from '@/graphql/context'

export class GraphQLEmpathyController {
  private empathyRepository: EmpathyRepositoryImpl
  private postRepository: PostRepositoryImpl
  private userRepository: UserRepositoryImpl

  constructor() {
    this.empathyRepository = new EmpathyRepositoryImpl()
    this.postRepository = new PostRepositoryImpl()
    this.userRepository = new UserRepositoryImpl()
  }

  async addEmpathy(
    args: {
      input: {
        postId: string
        empathyType: string
      }
    },
    context: GraphQLContext
  ) {
    if (!context.userId) {
      throw new Error('Authentication required')
    }

    const addEmpathyUseCase = new AddEmpathyUseCase(
      this.empathyRepository,
      this.postRepository,
      this.userRepository
    )

    try {
      const result = await addEmpathyUseCase.execute({
        postId: args.input.postId,
        userId: context.userId,
      })

      return result
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async removeEmpathy(
    args: {
      input: {
        postId: string
        empathyType: string
      }
    },
    context: GraphQLContext
  ) {
    if (!context.userId) {
      throw new Error('Authentication required')
    }

    const removeEmpathyUseCase = new RemoveEmpathyUseCase(
      this.empathyRepository,
      this.postRepository
    )

    try {
      const result = await removeEmpathyUseCase.execute({
        postId: args.input.postId,
        userId: context.userId,
      })

      return { success: true }
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }
}
