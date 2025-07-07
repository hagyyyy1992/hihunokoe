import { NextRequest } from 'next/server'
import { AuthController } from '@api/framework/controllers/AuthController'

const authController = new AuthController()

export async function GET(request: NextRequest) {
  return authController.getCurrentUser(request)
}
