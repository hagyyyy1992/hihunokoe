import { NextRequest } from 'next/server'
import { UserController } from '../../../../../../api/src/framework/controllers/UserController'

const userController = new UserController()

export async function GET(request: NextRequest) {
  return await userController.getMe(request)
}
