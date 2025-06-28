import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, AdminRequest } from '@/lib/auth/admin-middleware'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { logAdminAction } from '@/lib/auth/auth'

const handler = async (req: AdminRequest, { params }: { params: { id: string } }) => {
  try {
    const postId = params.id

    if (!isDatabaseAvailable()) {
      return NextResponse.json({ error: 'Database not available in mock mode' }, { status: 503 })
    }

    // 投稿情報を取得（削除前にログ用に保存）
    const postToDelete = await prisma!.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        user: {
          select: {
            userName: true,
          },
        },
      },
    })

    if (!postToDelete) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // 投稿を削除（CASCADE設定により関連するコメント、共感も削除される）
    await prisma!.post.delete({
      where: { id: postId },
    })

    // 管理者ログを記録
    await logAdminAction(
      req.user!.id,
      'POST_DELETE',
      postId,
      {
        postTitle: postToDelete.title,
        postUser: postToDelete.user.userName,
      },
      req.ip || req.headers.get('x-forwarded-for') || 'unknown',
      req.headers.get('user-agent') || 'unknown'
    )

    return NextResponse.json({
      message: 'Post deleted successfully',
      post: postToDelete,
    })
  } catch (error) {
    console.error('Post delete error:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}

export const POST = withAdminAuth(handler)
