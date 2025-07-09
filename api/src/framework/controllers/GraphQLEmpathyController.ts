import { EmpathyManagementUseCase } from '@api/usecases/posts/interactor'
import type { AddEmpathyInputPort, RemoveEmpathyInputPort } from '@api/usecases/posts/input-port'
import { EmpathyRepositoryImpl } from '@api/interface-adapters/repositories/EmpathyRepositoryImpl'
import { PostRepositoryImpl } from '@api/interface-adapters/repositories/PostRepositoryImpl'
import { UserRepositoryImpl } from '@api/interface-adapters/repositories/UserRepositoryImpl'
import { GraphQLContext } from '@/graphql/context'
import { EmpathyType } from '@api/domain/entities/Empathy'

export class GraphQLEmpathyController {
  private empathyManagementUseCase: EmpathyManagementUseCase

  constructor() {
    const empathyRepository = new EmpathyRepositoryImpl()
    const postRepository = new PostRepositoryImpl()
    const userRepository = new UserRepositoryImpl()

    this.empathyManagementUseCase = new EmpathyManagementUseCase(
      postRepository,
      userRepository,
      empathyRepository
    )
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

    const input: AddEmpathyInputPort = {
      postId: args.input.postId,
      userId: context.userId,
    }

    try {
      const result = await this.empathyManagementUseCase.addEmpathy(input)
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

    const input: RemoveEmpathyInputPort = {
      postId: args.input.postId,
      userId: context.userId,
    }

    try {
      await this.empathyManagementUseCase.removeEmpathy(input)
      return { success: true }
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }
}
