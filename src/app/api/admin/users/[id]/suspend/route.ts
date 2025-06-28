import { NextResponse } from 'next/server'
import { withAdminAuth, AdminRequest } from '@/lib/auth/admin-middleware'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { logAdminAction } from '@/lib/auth/auth'

const handler = async (req: AdminRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id: userId } = await context.params

    if (!isDatabaseAvailable()) {
      return NextResponse.json({ error: 'Database not available in mock mode' }, { status: 503 })
    }

    // ユーザーを無効化
    const updatedUser = await prisma!.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        userName: true,
        email: true,
      },
    })

    // 管理者ログを記録
    await logAdminAction(
      req.user!.id,
      'USER_SUSPEND',
      userId,
      { targetUser: updatedUser },
      req.ip || 'unknown',
      req.headers.get('user-agent') || 'unknown'
    )

    return NextResponse.json({
      message: 'User suspended successfully',
      user: updatedUser,
    })
  } catch (error) {
    console.error('User suspend error:', error)
    return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 })
  }
}

export const POST = withAdminAuth(handler)
