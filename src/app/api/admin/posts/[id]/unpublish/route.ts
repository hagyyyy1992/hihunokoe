import { NextRequest } from 'next/server'
import { AdminController } from '@api/framework/controllers/AdminController'

const adminController = new AdminController()

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  return adminController.unpublishPost(request, { params })
}
