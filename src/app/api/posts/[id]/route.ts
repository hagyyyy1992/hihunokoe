import { NextRequest } from 'next/server'
import { PostController } from '@api/framework/controllers/PostController'

const postController = new PostController()

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const resolvedParams = await context.params
  return postController.getPost(request, { params: { id: resolvedParams.id } })
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const resolvedParams = await context.params
  return postController.updatePost(request, { params: { id: resolvedParams.id } })
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const resolvedParams = await context.params
  return postController.deletePost(request, { params: { id: resolvedParams.id } })
}
