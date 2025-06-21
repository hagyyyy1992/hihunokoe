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
  } catch (error: any) {
    console.error('Login error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: '入力内容に誤りがあります', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 500 }
    )
  }
}