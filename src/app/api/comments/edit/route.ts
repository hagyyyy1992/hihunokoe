import { NextRequest, NextResponse } from 'next/server'
import { CommentController } from '@api/framework/controllers/CommentController'

const commentController = new CommentController()

// PUT /api/comments/edit - コメント編集 (query parameter使用)
export async function PUT(request: NextRequest) {
  const url = new URL(request.url)
  const commentId = url.searchParams.get('id')

  if (!commentId) {
    return NextResponse.json({ error: 'コメントIDが指定されていません' }, { status: 400 })
  }

  return commentController.updateComment(request, { params: { id: commentId } })
}

// DELETE /api/comments/edit - コメント削除（論理削除） (query parameter使用)
export async function DELETE(request: NextRequest) {
  const url = new URL(request.url)
  const commentId = url.searchParams.get('id')

  if (!commentId) {
    return NextResponse.json({ error: 'コメントIDが指定されていません' }, { status: 400 })
  }

  return commentController.deleteComment(request, { params: { id: commentId } })
}
