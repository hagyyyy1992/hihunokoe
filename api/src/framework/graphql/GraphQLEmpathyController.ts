import { EmpathyManagementUseCase } from '@api/usecases/posts/interactor'
import type { AddEmpathyInputPort, RemoveEmpathyInputPort } from '@api/usecases/posts/input-port'
import { EmpathyRepository } from '@api/interface-adapters/repositories/Empathy.repository'
import { PostRepository } from '@api/interface-adapters/repositories/Post.repository'
import { UserRepository } from '@api/interface-adapters/repositories/User.repository'
import { GraphQLContext } from '@/graphql/context'
import { EmpathyType } from '@api/domain/entities/Empathy'

export class GraphQLEmpathyController {
  private empathyManagementUseCase: EmpathyManagementUseCase

  constructor() {
    const empathyRepository = new EmpathyRepository()
    const postRepository = new PostRepository()
    const userRepository = new UserRepository()

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
