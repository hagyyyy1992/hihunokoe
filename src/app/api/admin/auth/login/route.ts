import { NextRequest } from 'next/server'
import { AdminController } from '@api/framework/controllers/AdminController'

const adminController = new AdminController()

export async function POST(request: NextRequest) {
  return adminController.login(request)
}
