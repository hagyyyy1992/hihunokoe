import { NextRequest } from 'next/server'
import { UserController } from '../../../../../../api/src/framework/controllers/UserController'
import { GetUserUseCase } from '../../../../../../api/src/usecases/user/GetUserUseCase'
import { UserRepositoryImpl } from '../../../../../../api/src/interface-adapters/repositories/UserRepositoryImpl'

// 依存関係の組み立て
const userRepository = new UserRepositoryImpl()
const getUserUseCase = new GetUserUseCase(userRepository)
const userController = new UserController(getUserUseCase)

export async function GET(request: NextRequest) {
  return await userController.getMe(request)
}
