import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isAdmin, logAdminAction } from '@/lib/auth/auth'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token =
    req.headers.get('authorization')?.replace('Bearer ', '') ||
    req.cookies.get('admin-auth-token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
  }

  const user = verifyToken(token)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
  }

  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
  }
  try {
    const { id: postId } = await params

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
      user.id,
      'POST_DELETE',
      postId,
      {
        postTitle: postToDelete.title,
        postUser: postToDelete.user.userName,
      },
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
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
