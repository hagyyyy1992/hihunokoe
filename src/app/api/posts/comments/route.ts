import { NextRequest } from 'next/server'
import { CommentController } from '@api/framework/controllers/CommentController'

const commentController = new CommentController()

// GET /api/posts/comments - コメント一覧取得 (query parameter使用)
export async function GET(request: Request) {
  return commentController.getCommentsWithPagination(request as NextRequest)
}

// POST /api/posts/comments - コメント投稿 (query parameter使用)
export async function POST(request: Request) {
  return commentController.createComment(request as NextRequest)
}
