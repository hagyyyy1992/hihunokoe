import { NextRequest } from 'next/server'
import { UserController } from '@api/framework/controllers/UserController'
import { GetUserInteractor } from '@api/usecases/user/interactor'
import { UserRepositoryImpl } from '@api/interface-adapters/repositories/UserRepositoryImpl'
import { AuthSessionRepositoryImpl } from '@api/interface-adapters/repositories/AuthSessionRepositoryImpl'
import { TokenServiceImpl } from '@api/interface-adapters/services/TokenServiceImpl'

// 依存関係の組み立て
const userRepository = new UserRepositoryImpl()
const authSessionRepository = new AuthSessionRepositoryImpl()
const tokenService = new TokenServiceImpl()
const getUserUseCase = new GetUserInteractor(userRepository)
const userController = new UserController(getUserUseCase, tokenService, authSessionRepository)

export async function GET(request: NextRequest) {
  return await userController.getMe(request)
}
