import { NextRequest } from 'next/server'
import { UserController } from '../../../../../../api/src/framework/controllers/UserController'

const userController = new UserController()

export async function GET(request: NextRequest) {
  console.log('[API Route] /api/v2/auth/me GET called')
  const result = await userController.getMe(request)
  console.log('[API Route] Controller response status:', result.status)
  return result
}
