import { NextResponse } from 'next/server'
import { withAdminAuth, AdminRequest } from '@/lib/auth/admin-middleware'
import { logAdminAction } from '@/lib/auth/auth'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'

const handler = async (req: AdminRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id: postId } = await context.params

    if (!isDatabaseAvailable()) {
      return NextResponse.json({ error: 'Database not available in mock mode' }, { status: 503 })
    }

    // 投稿を公開状態に変更
    const updatedPost = await prisma!.post.update({
      where: { id: postId },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
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
      'POST_PUBLISH',
      postId,
      {
        postTitle: updatedPost.title,
        postUser: updatedPost.user.userName,
      },
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      req.headers.get('user-agent') || 'unknown'
    )

    return NextResponse.json({
      message: 'Post published successfully',
      post: updatedPost,
    })
  } catch (error) {
    console.error('Post publish error:', error)
    return NextResponse.json({ error: 'Failed to publish post' }, { status: 500 })
  }
}

export const POST = withAdminAuth(handler)
