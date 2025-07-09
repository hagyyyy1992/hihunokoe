import { NextRequest } from 'next/server'
import { AuthController } from '@api/framework/controllers/AuthController'
import { adaptCookieToBearer } from '@/lib/auth/cookie-auth-adapter'

const authController = new AuthController()

export async function DELETE(request: Request) {
  const adaptedRequest = adaptCookieToBearer(request)
  return authController.deleteAccount(adaptedRequest as NextRequest)
}
