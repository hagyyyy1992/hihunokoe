import { NextRequest, NextResponse } from 'next/server'
import { resetPassword } from '@/lib/auth/password-reset'
import { z } from 'zod'
import {
  passwordResetExecutionLimiter,
  getClientIP,
  createRateLimitErrorResponse,
} from '@/lib/rate-limiter'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'トークンが必要です'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
})

export async function POST(request: NextRequest) {
  try {
    // レート制限チェック
    const clientIP = getClientIP(request)
    const rateLimitResult = passwordResetExecutionLimiter.checkLimit(clientIP)

    if (!rateLimitResult.allowed) {
      const errorResponse = createRateLimitErrorResponse(rateLimitResult.resetTime)
      return NextResponse.json(errorResponse, {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        },
      })
    }

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
