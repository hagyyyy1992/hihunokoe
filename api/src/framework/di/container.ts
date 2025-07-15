import { PrismaClient } from '@prisma/client'
import { UserRepository } from '@api/interface-adapters/repositories/User.repository'
import { PostRepository } from '@api/interface-adapters/repositories/Post.repository'
import { CommentRepository } from '@api/interface-adapters/repositories/Comment.repository'
import { AdminLogRepository } from '@api/interface-adapters/repositories/AdminLog.repository'
import { EmpathyRepository } from '@api/interface-adapters/repositories/Empathy.repository'
import { PasswordHashServiceImpl } from '@api/interface-adapters/services/PasswordHashService'
import { TokenServiceImpl } from '@api/interface-adapters/services/TokenService'
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
import { IPasswordHashService } from '@api/domain/services/PasswordHashService'
import { ITokenService } from '@api/domain/services/TokenService'
import { RateLimitService } from '@api/interface-adapters/services/RateLimitService'
import { IRateLimitService } from '@api/domain/services/RateLimitService'
import { IAuthService } from '@api/domain/services/AuthService'
import { AuthServiceImpl } from '@api/interface-adapters/services/AuthService'
import { ICacheService } from '@api/domain/services/CacheService'
import { CacheServiceImpl } from '@api/interface-adapters/services/CacheService'
import { IFieldMappingService } from '@api/domain/services/FieldMappingService'
import { FieldMappingServiceImpl } from '@api/interface-adapters/services/FieldMappingService'

// Singleton instances
const prismaClient = new PrismaClient()

// Repositories
const userRepository: IUserRepository = new UserRepository()
const postRepository: IPostRepository = new PostRepository()
const commentRepository: ICommentRepository = new CommentRepository()
const adminLogRepository: IAdminLogRepository = new AdminLogRepository(prismaClient)
const empathyRepository: IEmpathyRepository = new EmpathyRepository()

// Services
const passwordHashService: IPasswordHashService = new PasswordHashServiceImpl()
const tokenService: ITokenService = new TokenServiceImpl()
const rateLimitService: IRateLimitService = new RateLimitService()
const authService: IAuthService = new AuthServiceImpl(tokenService)
const cacheService: ICacheService = new CacheServiceImpl()
const fieldMappingService: IFieldMappingService = new FieldMappingServiceImpl()

// Use Cases
const commentManagementUseCase = new CommentManagementUseCase(
  commentRepository,
  postRepository,
  userRepository,
  rateLimitService
)

const commentRetrievalUseCase = new CommentRetrievalUseCase(commentRepository)

const postManagementUseCase = new PostManagementUseCase(
  postRepository,
  userRepository,
  empathyRepository,
  commentRepository,
  rateLimitService
)

const postRetrievalUseCase = new PostRetrievalUseCase(
  postRepository,
  userRepository,
  empathyRepository,
  commentRepository
)

const empathyManagementUseCase = new EmpathyManagementUseCase(
  postRepository,
  userRepository,
  empathyRepository,
  rateLimitService
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
    authService,
    cacheService,
    fieldMappingService,
  },
  useCases: {
    commentManagementUseCase,
    commentRetrievalUseCase,
    postManagementUseCase,
    postRetrievalUseCase,
    empathyManagementUseCase,
  },
}
