import { PrismaClient } from '@prisma/client'
import { UserRepository } from '@api/interface-adapters/repositories/User.repository'
import { PostRepository } from '@api/interface-adapters/repositories/Post.repository'
import { CommentRepository } from '@api/interface-adapters/repositories/Comment.repository'
import { AdminLogRepository } from '@api/interface-adapters/repositories/AdminLog.repository'
import { EmpathyRepository } from '@api/interface-adapters/repositories/Empathy.repository'
import { PasswordHashServiceImpl } from '@api/interface-adapters/services/PasswordHashServiceImpl'
import { TokenServiceImpl } from '@api/interface-adapters/services/TokenServiceImpl'
import {
  CommentManagementUseCase,
  CommentRetrievalUseCase,
} from '@api/usecases/comments/interactor'
import {
  PostManagementUseCase,
  PostRetrievalUseCase,
  EmpathyManagementUseCase,
} from '@api/usecases/posts/interactor'
import { IUserRepository } from '@api/domain/repositories/UserRepository'
import { IPostRepository } from '@api/domain/repositories/PostRepository'
import { ICommentRepository } from '@api/domain/repositories/CommentRepository'
import { IAdminLogRepository } from '@api/domain/repositories/AdminLogRepository'
import { IEmpathyRepository } from '@api/domain/repositories/EmpathyRepository'
import { PasswordHashService } from '@api/domain/services/PasswordHashService'
import { TokenService } from '@api/domain/services/TokenService'
import { RateLimitServiceImpl } from '@api/interface-adapters/services/RateLimitServiceImpl'
import { RateLimitService } from '@api/domain/services/RateLimitService'

// Singleton instances
const prismaClient = new PrismaClient()

// Repositories
const userRepository: IUserRepository = new UserRepository()
const postRepository: IPostRepository = new PostRepository()
const commentRepository: ICommentRepository = new CommentRepository()
const adminLogRepository: IAdminLogRepository = new AdminLogRepository(prismaClient)
const empathyRepository: IEmpathyRepository = new EmpathyRepository()

// Services
const passwordHashService: PasswordHashService = new PasswordHashServiceImpl()
const tokenService: TokenService = new TokenServiceImpl()
const rateLimitService: RateLimitService = new RateLimitServiceImpl()

// Use Cases
const commentManagementUseCase = new CommentManagementUseCase(
  commentRepository,
  postRepository,
  userRepository,
  rateLimitService
)

const commentRetrievalUseCase = new CommentRetrievalUseCase(commentRepository)

const postManagementUseCase = new PostManagementUseCase(postRepository, userRepository)

const postRetrievalUseCase = new PostRetrievalUseCase(
  postRepository,
  empathyRepository,
  commentRepository
)

const empathyManagementUseCase = new EmpathyManagementUseCase(
  postRepository,
  userRepository,
  empathyRepository
)

// Export for manual dependency injection
export const dependencies = {
  repositories: {
    userRepository,
    postRepository,
    commentRepository,
    adminLogRepository,
    empathyRepository,
  },
  services: {
    passwordHashService,
    tokenService,
    rateLimitService,
  },
  useCases: {
    commentManagementUseCase,
    commentRetrievalUseCase,
    postManagementUseCase,
    postRetrievalUseCase,
    empathyManagementUseCase,
  },
}
