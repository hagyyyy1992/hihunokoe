import { NextRequest, NextResponse } from 'next/server'
import { registerUser, generateToken } from '@/lib/auth/auth'
import { z } from 'zod'

const registerSchema = z.object({
  userName: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().optional(),
  skinType: z.enum(['normal', 'dry', 'oily', 'combination', 'sensitive']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validatedData = registerSchema.parse(body)
    
    // ユーザー名とメールアドレスの重複チェックは Prisma のユニーク制約で行われる
    const user = await registerUser(validatedData)
    const token = generateToken(user)
    
    const response = NextResponse.json({
      user,
      message: 'ユーザー登録が完了しました',
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
    console.error('Registration error:', error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'ユーザー名またはメールアドレスが既に使用されています' },
        { status: 400 }
      )
    }
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError' && 'errors' in error) {
      return NextResponse.json(
        { error: '入力内容に誤りがあります', details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'ユーザー登録に失敗しました' },
      { status: 500 }
    )
  }
}