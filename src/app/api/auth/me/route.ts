import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getUserById } from '@/lib/auth/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: 'トークンが無効です' }, { status: 401 })
    }

    const user = await getUserById(decoded.id)

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'ユーザー情報の取得に失敗しました' }, { status: 500 })
  }
}
