import { NextRequest } from 'next/server'
import { AuthController } from '@api/framework/controllers/AuthController'

const authController = new AuthController()

export async function DELETE(request: Request) {
  return authController.deleteAccount(request as NextRequest)
}
