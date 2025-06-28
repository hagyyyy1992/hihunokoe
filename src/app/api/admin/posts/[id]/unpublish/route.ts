import { NextResponse } from 'next/server'
import { withAdminAuth, AdminRequest } from '@/lib/auth/admin-middleware'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { logAdminAction } from '@/lib/auth/auth'

const handler = async (req: AdminRequest, context?: { params?: Record<string, string> }) => {
  try {
    const postId = context?.params?.id
    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

    if (!isDatabaseAvailable()) {
      return NextResponse.json({ error: 'Database not available in mock mode' }, { status: 503 })
    }

    // 投稿を非公開状態に変更
    const updatedPost = await prisma!.post.update({
      where: { id: postId },
      data: { status: 'hidden' },
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

    // 管理者ログを記録
    await logAdminAction(
      req.user!.id,
      'POST_UNPUBLISH',
      postId,
      {
        postTitle: updatedPost.title,
        postUser: updatedPost.user.userName,
      },
      req.ip || 'unknown',
      req.headers.get('user-agent') || 'unknown'
    )

    return NextResponse.json({
      message: 'Post unpublished successfully',
      post: updatedPost,
    })
  } catch (error) {
    console.error('Post unpublish error:', error)
    return NextResponse.json({ error: 'Failed to unpublish post' }, { status: 500 })
  }
}

export const POST = withAdminAuth(handler)
