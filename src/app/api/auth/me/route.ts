import { NextRequest } from 'next/server'
import { AuthController } from '@api/framework/controllers/AuthController'

const authController = new AuthController()

export async function GET(request: Request) {
  return authController.getCurrentUser(request as NextRequest)
}
