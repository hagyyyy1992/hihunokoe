import { NextRequest, NextResponse } from 'next/server'
import { resetPassword } from '@/lib/auth/password-reset'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'トークンが必要です'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = resetPasswordSchema.parse(body)

    const result = await resetPassword(validatedData.token, validatedData.password)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      })
    } else {
      return NextResponse.json(
        {
          error: result.message,
        },
        { status: 400 }
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'パスワードリセット中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
