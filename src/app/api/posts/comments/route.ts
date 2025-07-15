import { NextRequest } from 'next/server'
import { ControllerFactory } from '@api/framework/factories/ControllerFactory'

const commentController = ControllerFactory.createCommentController()

// GET /api/posts/comments - コメント一覧取得 (query parameter使用)
export async function GET(request: Request) {
  return commentController.getCommentsWithPagination(request as NextRequest)
}

// POST /api/posts/comments - コメント投稿 (query parameter使用)
export async function POST(request: Request) {
  return commentController.createComment(request as NextRequest)
}
