import { NextRequest, NextResponse } from 'next/server'
import { verifyPasswordResetToken } from '@/lib/auth/password-reset'
import { z } from 'zod'

const verifyTokenSchema = z.object({
  token: z.string().min(1, 'トークンが必要です'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = verifyTokenSchema.parse(body)

    const result = await verifyPasswordResetToken(validatedData.token)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 400 }
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Token verification error:', error)
    return NextResponse.json(
      { success: false, message: 'トークンの確認中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
