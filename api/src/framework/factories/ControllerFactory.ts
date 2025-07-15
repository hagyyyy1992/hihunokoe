import { CommentController } from '@api/framework/controllers/CommentController'
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
}
