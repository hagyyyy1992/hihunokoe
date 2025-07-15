import { NextRequest } from 'next/server'
import { ControllerFactory } from '@api/framework/factories/ControllerFactory'

const commentController = ControllerFactory.createCommentController()

// GET /api/posts/[id]/comments - コメント一覧取得
// Fixed Vercel deployment routing issue
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const url = new URL(request.url)
  url.searchParams.set('postId', resolvedParams.id)
  const newRequest = new NextRequest(url, request)
  return commentController.getComments(newRequest)
}

// POST /api/posts/[id]/comments - コメント投稿
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const url = new URL(request.url)
  url.searchParams.set('id', resolvedParams.id)
  const newRequest = new NextRequest(url, request)
  return commentController.createComment(newRequest)
}
