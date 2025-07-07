import { NextRequest } from 'next/server'
import { CommentController } from '@api/framework/controllers/CommentController'

const commentController = new CommentController()

// POST /api/comments/reply - 返信投稿 (query parameter使用)
export async function POST(request: NextRequest) {
  return commentController.createReply(request)
}
