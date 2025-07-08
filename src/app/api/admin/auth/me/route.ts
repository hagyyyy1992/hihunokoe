import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const userData = verifyToken(token)

    if (!userData || (userData.role !== 'ADMIN' && userData.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json({ error: '認証エラーが発生しました' }, { status: 500 })
  }
}
