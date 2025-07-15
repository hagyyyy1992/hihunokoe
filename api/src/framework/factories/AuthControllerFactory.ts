import { AuthController } from '@api/framework/controllers/AuthController'
import {
  AuthenticationUseCase,
  PasswordManagementUseCase,
  EmailVerificationUseCase,
  AccountManagementUseCase,
} from '@api/usecases/auth/interactor'
import { UserRepository } from '@api/interface-adapters/repositories/User.repository'
import { AuthSessionRepository } from '@api/interface-adapters/repositories/AuthSession.repository'
import { PostRepository } from '@api/interface-adapters/repositories/Post.repository'
import { PasswordHashServiceImpl } from '@api/interface-adapters/services/PasswordHashServiceImpl'
import { TokenServiceImpl } from '@api/interface-adapters/services/TokenServiceImpl'
import { EmailService } from '@api/interface-adapters/services/EmailService'
import { WithdrawalSurveyRepository } from '@api/interface-adapters/repositories/WithdrawalSurvey.repository'
import { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'

let authControllerInstance: AuthController | null = null

export class AuthControllerFactory {
  static create(): AuthController {
    // シングルトンパターンで同じインスタンスを再利用
    if (authControllerInstance) {
      return authControllerInstance
    }

    // 依存関係の初期化
    const prismaClient = prisma || new PrismaClient()
    const userRepository = new UserRepository()
    const authSessionRepository = new AuthSessionRepository()
    const postRepository = new PostRepository()
    const passwordHashService = new PasswordHashServiceImpl()
    const tokenService = new TokenServiceImpl()
    const emailService = new EmailService()
    const withdrawalSurveyRepository = new WithdrawalSurveyRepository(prismaClient)

    // ユースケースの初期化
    const authenticationUseCase = new AuthenticationUseCase(
      userRepository,
      authSessionRepository,
      passwordHashService,
      tokenService
    )

    const passwordManagementUseCase = new PasswordManagementUseCase(
      userRepository,
      passwordHashService,
      tokenService,
      emailService
    )

    const emailVerificationUseCase = new EmailVerificationUseCase(
      userRepository,
      tokenService,
      emailService
    )

    const accountManagementUseCase = new AccountManagementUseCase(
      userRepository,
      authSessionRepository,
      passwordHashService,
      emailService,
      withdrawalSurveyRepository,
      postRepository
    )

    // コントローラーの生成
    authControllerInstance = new AuthController(
      authenticationUseCase,
      passwordManagementUseCase,
      emailVerificationUseCase,
      accountManagementUseCase,
      emailService
    )

    return authControllerInstance
  }

  // テスト用のリセットメソッド
  static reset(): void {
    authControllerInstance = null
  }
}
