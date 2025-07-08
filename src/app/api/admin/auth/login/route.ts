import { NextRequest, NextResponse } from 'next/server'
import { loginUser, generateToken, isAdmin, logAdminAction } from '@/lib/auth/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('[ADMIN LOGIN] Request received')
    const { email, password } = await request.json()
    console.log('[ADMIN LOGIN] Email:', email)

    if (!email || !password) {
      console.log('[ADMIN LOGIN] Missing email or password')
      return NextResponse.json({ error: 'メールアドレスとパスワードは必須です' }, { status: 400 })
    }

    console.log('[ADMIN LOGIN] Attempting login for:', email)
    const user = await loginUser({ email, password })
    console.log('[ADMIN LOGIN] Login result:', user ? 'User found' : 'User not found')

    if (!user) {
      console.log('[ADMIN LOGIN] Login failed - user not found or invalid credentials')
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが間違っています' },
        { status: 401 }
      )
    }

    console.log('[ADMIN LOGIN] User role:', user.role)
    if (!isAdmin(user)) {
      console.log('[ADMIN LOGIN] User is not admin')
      return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 })
    }

    console.log('[ADMIN LOGIN] Generating token...')
    const token = generateToken(user)
    console.log('[ADMIN LOGIN] Token generated successfully')

    console.log('[ADMIN LOGIN] Logging admin action...')
    await logAdminAction(
      user.id,
      'ADMIN_LOGIN',
      undefined,
      { email },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    )
    console.log('[ADMIN LOGIN] Admin action logged successfully')

    console.log('[ADMIN LOGIN] Login successful')

    // レスポンスを作成
    const response = NextResponse.json({
      token,
      user: {
        id: user.id,
        userName: user.userName,
        email: user.email,
        role: user.role,
      },
    })

    // HTTPOnlyクッキーをセット（サーバーサイド）
    const isProduction = process.env.NODE_ENV === 'production'
    response.cookies.set('admin-auth-token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7日間
    })

    return response
  } catch (error) {
    console.error('[ADMIN LOGIN] ERROR:', error)
    console.error(
      '[ADMIN LOGIN] ERROR Stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    )
    console.error(
      '[ADMIN LOGIN] ERROR Message:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
