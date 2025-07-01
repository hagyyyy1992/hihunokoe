import { NextRequest } from 'next/server'
import { UserController } from '@api/framework/controllers/UserController'
import { GetUserUseCase } from '@api/usecases/user/GetUserUseCase'
import { UserRepositoryImpl } from '@api/interface-adapters/repositories/UserRepositoryImpl'

// 依存関係の組み立て
const userRepository = new UserRepositoryImpl()
const getUserUseCase = new GetUserUseCase(userRepository)
const userController = new UserController(getUserUseCase)

export async function GET(request: NextRequest) {
  return await userController.getMe(request)
}
