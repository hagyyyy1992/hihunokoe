import { NextRequest } from 'next/server'
import { AuthControllerFactory } from '@api/framework/factories/AuthControllerFactory'

export async function GET(request: Request) {
  const authController = AuthControllerFactory.create()
  return authController.verifyEmail(request as NextRequest)
}
