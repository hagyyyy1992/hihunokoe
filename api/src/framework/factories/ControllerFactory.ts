import { CommentController } from '@api/framework/controllers/CommentController'
import { PostController } from '@api/framework/controllers/PostController'
import { GraphQLPostController } from '@api/framework/graphql/GraphQLPostController'
import { dependencies } from '@api/framework/di/container'

export class ControllerFactory {
  static createCommentController(): CommentController {
    return new CommentController(
      dependencies.useCases.commentManagementUseCase,
      dependencies.useCases.commentRetrievalUseCase,
      dependencies.services.tokenService,
      dependencies.repositories.userRepository,
      dependencies.repositories.commentRepository
    )
  }

  static createPostController(): PostController {
    return new PostController(
      dependencies.useCases.postManagementUseCase,
      dependencies.useCases.postRetrievalUseCase,
      dependencies.useCases.empathyManagementUseCase,
      dependencies.services.tokenService,
      dependencies.repositories.userRepository,
      dependencies.repositories.empathyRepository,
      dependencies.repositories.commentRepository
    )
  }

  static createGraphQLPostController(): GraphQLPostController {
    return new GraphQLPostController(
      dependencies.useCases.postRetrievalUseCase,
      dependencies.useCases.postManagementUseCase,
      dependencies.useCases.empathyManagementUseCase,
      dependencies.repositories.userRepository,
      dependencies.repositories.postRepository,
      dependencies.repositories.empathyRepository,
      dependencies.repositories.commentRepository
    )
  }
}
