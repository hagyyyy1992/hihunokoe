import { NextRequest } from 'next/server'
import { CommentController } from '@api/framework/controllers/CommentController'

const commentController = new CommentController()

// GET /api/posts/[id]/comments - コメント一覧取得
// Fixed Vercel deployment routing issue
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return commentController.getCommentsForPost(request as NextRequest, { params: resolvedParams })
}

// POST /api/posts/[id]/comments - コメント投稿
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return commentController.createCommentForPost(request as NextRequest, { params: resolvedParams })
}
