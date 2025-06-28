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
    const { id: userId } = await params

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
      user.id,
      'USER_SUSPEND',
      userId,
      { targetUser: updatedUser },
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
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
