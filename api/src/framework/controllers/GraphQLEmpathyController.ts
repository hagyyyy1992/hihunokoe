import { AddEmpathyUseCase } from '@api/usecases/posts/AddEmpathyUseCase'
import { RemoveEmpathyUseCase } from '@api/usecases/posts/RemoveEmpathyUseCase'
import { EmpathyRepositoryImpl } from '@api/interface-adapters/repositories/EmpathyRepositoryImpl'
import { GraphQLContext } from '@/graphql/context'

export class GraphQLEmpathyController {
  private empathyRepository: EmpathyRepositoryImpl

  constructor() {
    this.empathyRepository = new EmpathyRepositoryImpl()
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

    const addEmpathyUseCase = new AddEmpathyUseCase(this.empathyRepository)

    try {
      const { empathy } = await addEmpathyUseCase.execute({
        postId: args.input.postId,
        userId: context.userId,
        empathyType: args.input.empathyType,
      })

      return empathy
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

    const removeEmpathyUseCase = new RemoveEmpathyUseCase(this.empathyRepository)

    try {
      await removeEmpathyUseCase.execute({
        postId: args.input.postId,
        userId: context.userId,
        empathyType: args.input.empathyType,
      })

      return { success: true }
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }
}
