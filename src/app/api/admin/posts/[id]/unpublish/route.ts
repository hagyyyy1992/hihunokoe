import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isAdmin, logAdminAction } from '@/lib/auth/auth'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token =
    req.headers.get('authorization')?.replace('Bearer ', '') || req.cookies.get('auth-token')?.value

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
      user.id,
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
