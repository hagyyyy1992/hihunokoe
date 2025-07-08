import { NextRequest } from 'next/server'
import { AuthController } from '@api/framework/controllers/AuthController'
import { adaptCookieToBearer } from '@/lib/auth/cookie-auth-adapter'

const authController = new AuthController()

export async function GET(request: Request) {
  const adaptedRequest = adaptCookieToBearer(request as NextRequest)
  return authController.getCurrentUser(adaptedRequest)
}
