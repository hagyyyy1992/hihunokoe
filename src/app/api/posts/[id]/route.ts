import { NextRequest, NextResponse } from 'next/server'
import { PostController } from '@api/framework/controllers/PostController'

const postController = new PostController()

// UUIDバリデーション関数
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const resolvedParams = await context.params
  
  // UUIDバリデーション
  if (!isValidUUID(resolvedParams.id)) {
    return NextResponse.json(
      { error: 'Invalid post ID format' },
      { status: 400 }
    )
  }
  
  return postController.getPost(request, { params: { id: resolvedParams.id } })
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const resolvedParams = await context.params
  
  // UUIDバリデーション
  if (!isValidUUID(resolvedParams.id)) {
    return NextResponse.json(
      { error: 'Invalid post ID format' },
      { status: 400 }
    )
  }
  
  return postController.updatePost(request, { params: { id: resolvedParams.id } })
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const resolvedParams = await context.params
  
  // UUIDバリデーション
  if (!isValidUUID(resolvedParams.id)) {
    return NextResponse.json(
      { error: 'Invalid post ID format' },
      { status: 400 }
    )
  }
  
  return postController.deletePost(request, { params: { id: resolvedParams.id } })
}
