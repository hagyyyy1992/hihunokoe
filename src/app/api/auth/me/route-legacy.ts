// E2E環境用の一時的なレガシー実装
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/auth'

export async function GET(request: NextRequest) {
  // クッキーからトークンを取得
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 })
  }

  try {
    // レガシーシステムの認証検証を使用
    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
