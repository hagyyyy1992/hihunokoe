import { NextRequest } from 'next/server'
import { CommentController } from '@api/framework/controllers/CommentController'

const commentController = new CommentController()

// PUT /api/comments/[id] - コメント編集
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return commentController.updateComment(request, { params: { id } })
}

// DELETE /api/comments/[id] - コメント削除（論理削除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return commentController.deleteComment(request, { params: { id } })
}
