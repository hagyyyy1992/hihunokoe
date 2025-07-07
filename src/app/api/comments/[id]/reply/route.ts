import { NextRequest } from 'next/server'
import { CommentController } from '@api/framework/controllers/CommentController'

const commentController = new CommentController()

// POST /api/comments/[id]/reply - 返信投稿
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Add the parent comment ID to the request URL for the controller
  const url = new URL(request.url)
  url.searchParams.set('id', id)
  const newRequest = new NextRequest(url, request)
  return commentController.createReply(newRequest)
}
