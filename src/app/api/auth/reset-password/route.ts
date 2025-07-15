import { NextRequest } from 'next/server'
import { AuthControllerFactory } from '@api/framework/factories/AuthControllerFactory'

export async function POST(request: NextRequest) {
  const authController = AuthControllerFactory.create()
  return authController.resetPassword(request)
}
