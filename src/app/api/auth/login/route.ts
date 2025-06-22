import { NextRequest, NextResponse } from 'next/server'
import { loginUser, generateToken } from '@/lib/auth/auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validatedData = loginSchema.parse(body)

    const user = await loginUser(validatedData)

    if (!user) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが間違っています' },
        { status: 401 }
      )
    }

    // メール認証チェック
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: 'メールアドレスの確認が完了していません。確認メールをご確認ください。',
          emailVerificationRequired: true,
          email: user.email,
        },
        { status: 403 }
      )
    }

    const token = generateToken(user)

    const response = NextResponse.json({
      user,
      message: 'ログインしました',
    })

    // HttpOnly Cookie にトークンを設定
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7日間
    })

    return response
  } catch (error: unknown) {
    console.error('Login error:', error)

    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'ZodError' &&
      'errors' in error
    ) {
      return NextResponse.json(
        {
          error: '入力内容に誤りがあります',
          details: (error as unknown as { errors: unknown }).errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'ログインに失敗しました' }, { status: 500 })
  }
}
