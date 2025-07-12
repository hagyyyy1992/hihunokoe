import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const userData = verifyToken(token)

    if (!userData) {
      return NextResponse.json({ error: '無効なトークンです' }, { status: 401 })
    }

    // UserRoleの値を確認
    const userRole = userData.role?.toString()
    if (
      userRole !== 'ADMIN' &&
      userRole !== 'SUPER_ADMIN' &&
      userRole !== 'admin' &&
      userRole !== 'super_admin'
    ) {
      console.error('Invalid role:', userData.role)
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    return NextResponse.json({
      id: userData.id,
      userName: userData.userName,
      email: userData.email,
      role: userData.role,
    })
  } catch (error) {
    console.error('Auth me error:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack)
    }
    return NextResponse.json({ error: '認証エラーが発生しました' }, { status: 500 })
  }
}
