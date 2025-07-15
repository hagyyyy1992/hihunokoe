import { NextRequest } from 'next/server'
import { AuthControllerFactory } from '@api/framework/factories/AuthControllerFactory'
import { adaptCookieToBearer } from '@/lib/auth/cookie-auth-adapter'

export async function DELETE(request: Request) {
  const authController = AuthControllerFactory.create()
  const adaptedRequest = adaptCookieToBearer(request)
  return authController.deleteAccount(adaptedRequest as NextRequest)
}
