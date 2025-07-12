import { NextRequest, NextResponse } from 'next/server'
import { CommentController } from '@api/framework/controllers/CommentController'

let commentController: CommentController | null = null

try {
  commentController = new CommentController()
} catch (error) {
  console.error('Failed to initialize CommentController:', error)
}

// POST /api/comments/reply - 返信投稿 (query parameter使用)
export async function POST(request: NextRequest) {
  if (!commentController) {
    console.error('CommentController not available - database connection issue')
    return NextResponse.json(
      { error: 'データベース接続エラーが発生しました。管理者にお問い合わせください。' },
      { status: 500 }
    )
  }

  return commentController.createReply(request)
}
