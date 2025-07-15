import { NextRequest } from 'next/server'
import { AuthControllerFactory } from '@api/framework/factories/AuthControllerFactory'

export async function POST(request: Request) {
  const authController = AuthControllerFactory.create()
  return authController.register(request as NextRequest)
}
