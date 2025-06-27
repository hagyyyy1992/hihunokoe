import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailToken } from '@/lib/auth/email-verification'
import { generateToken } from '@/lib/auth/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'トークンが提供されていません' }, { status: 400 })
    }

    const result = await verifyEmailToken(token)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    // メール確認が完了したらログイン状態にする
    if (result.user) {
      const authToken = generateToken(result.user)
      const response = NextResponse.json({
        message: result.message,
        user: {
          id: result.user.id,
          userName: result.user.userName,
          email: result.user.email,
          skinType: result.user.skinType,
          emailVerified: result.user.emailVerified,
        },
      })

      // 既存のauth-tokenクッキーをクリアしてから新しいトークンを設定
      response.cookies.delete('auth-token')
      response.cookies.set('auth-token', authToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7日間
      })

      return response
    }

    return NextResponse.json({ message: result.message })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ error: 'メールアドレスの確認に失敗しました' }, { status: 500 })
  }
}
