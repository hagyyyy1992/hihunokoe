import { NextRequest } from 'next/server'
import { PostController } from '@api/framework/controllers/PostController'

const postController = new PostController()

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const resolvedParams = await context.params
  return postController.getEmpathyStatus(request, { params: { id: resolvedParams.id } })
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const resolvedParams = await context.params
  return postController.addEmpathy(request, { params: { id: resolvedParams.id } })
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const resolvedParams = await context.params
  return postController.removeEmpathy(request, { params: { id: resolvedParams.id } })
}
