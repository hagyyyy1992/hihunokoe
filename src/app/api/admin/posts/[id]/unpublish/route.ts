import { NextResponse } from 'next/server'
import { logAdminAction, adminMiddleware, AdminRequest } from '@/lib/auth/admin-middleware'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'

const handler = async (req: AdminRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id: postId } = await context.params

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
      req.user.id,
      'POST_UNPUBLISH',
      postId,
      {
        postTitle: updatedPost.title,
        postUser: updatedPost.user.userName,
      },
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
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

export const POST = adminMiddleware(handler)
