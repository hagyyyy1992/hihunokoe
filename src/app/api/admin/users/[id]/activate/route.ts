import { NextResponse } from 'next/server'
import { withAdminAuth, AdminRequest } from '@/lib/auth/admin-middleware'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { logAdminAction } from '@/lib/auth/auth'

const handler = async (req: AdminRequest, context: { params: Promise<Record<string, string>> }) => {
  try {
    const params = await context.params
    const userId = params?.id
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!isDatabaseAvailable()) {
      return NextResponse.json({ error: 'Database not available in mock mode' }, { status: 503 })
    }

    // ユーザーを有効化
    const updatedUser = await prisma!.user.update({
      where: { id: userId },
      data: { isActive: true },
      select: {
        id: true,
        userName: true,
        email: true,
      },
    })

    // 管理者ログを記録
    await logAdminAction(
      req.user!.id,
      'USER_ACTIVATE',
      userId,
      { targetUser: updatedUser },
      req.ip || 'unknown',
      req.headers.get('user-agent') || 'unknown'
    )

    return NextResponse.json({
      message: 'User activated successfully',
      user: updatedUser,
    })
  } catch (error) {
    console.error('User activate error:', error)
    return NextResponse.json({ error: 'Failed to activate user' }, { status: 500 })
  }
}

export const POST = withAdminAuth(handler)
