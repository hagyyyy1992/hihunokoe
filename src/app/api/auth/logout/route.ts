import { NextRequest } from 'next/server'
import { AuthController } from '@api/framework/controllers/AuthController'

const authController = new AuthController()

export async function POST(request: Request) {
  return authController.logout(request as NextRequest)
}
