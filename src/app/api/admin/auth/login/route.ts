import { NextRequest, NextResponse } from 'next/server'
import { loginUser, generateToken, isAdmin, logAdminAction } from '@/lib/auth/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'メールアドレスとパスワードは必須です' }, { status: 400 })
    }

    const user = await loginUser({ email, password })

    if (!user) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが間違っています' },
        { status: 401 }
      )
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 })
    }

    const token = generateToken(user)

    await logAdminAction(
      user.id,
      'ADMIN_LOGIN',
      undefined,
      { email },
      request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    )

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        userName: user.userName,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
