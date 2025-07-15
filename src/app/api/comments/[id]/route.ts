import { NextRequest } from 'next/server'
import { ControllerFactory } from '@api/framework/factories/ControllerFactory'

const commentController = ControllerFactory.createCommentController()

// PUT /api/comments/[id] - コメント編集
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(request.url)
  url.searchParams.set('id', id)
  const newRequest = new NextRequest(url, request)
  return commentController.updateComment(newRequest)
}

// DELETE /api/comments/[id] - コメント削除（論理削除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = new URL(request.url)
  url.searchParams.set('id', id)
  const newRequest = new NextRequest(url, request)
  return commentController.deleteComment(newRequest)
}
