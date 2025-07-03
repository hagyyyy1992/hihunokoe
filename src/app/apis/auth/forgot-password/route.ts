import { NextRequest, NextResponse } from 'next/server'
import { sendPasswordResetEmail } from '@/lib/auth/password-reset'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { MOCK_USERS } from '@/lib/mock-data'
import { z } from 'zod'
import { passwordResetLimiter, getClientIP, createRateLimitErrorResponse } from '@/lib/rate-limiter'

const forgotPasswordSchema = z.object({
  email: z
    .string({
      required_error: 'メールアドレスは必須です',
      invalid_type_error: 'メールアドレスは文字列である必要があります',
    })
    .email('有効なメールアドレスを入力してください'),
})

export async function POST(request: NextRequest) {
  try {
    // レート制限チェック
    const clientIP = getClientIP(request)
    const rateLimitResult = passwordResetLimiter.checkLimit(clientIP)

    if (!rateLimitResult.allowed) {
      const errorResponse = createRateLimitErrorResponse(rateLimitResult.resetTime)
      return NextResponse.json(errorResponse, {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        },
      })
    }

    const body = await request.json()
    const validatedData = forgotPasswordSchema.parse(body)

    if (isDatabaseAvailable()) {
      const user = await prisma!.user.findUnique({
        where: {
          email: validatedData.email,
          isActive: true,
          deletedAt: null,
        },
      })

      if (user) {
        try {
          // リクエストから動的にベースURLを取得
          const host = request.headers.get('host')
          const protocol = request.headers.get('x-forwarded-proto') || 'http'
          const baseUrl = host ? `${protocol}://${host}` : undefined
          await sendPasswordResetEmail(user.id, user.email, user.userName, baseUrl)
        } catch (emailError) {
          console.error('Failed to send password reset email:', {
            error: emailError,
            message: emailError instanceof Error ? emailError.message : 'Unknown error',
            stack: emailError instanceof Error ? emailError.stack : undefined,
            userId: user.id,
            email: user.email,
          })
        }
      }
    } else {
      const mockUser = MOCK_USERS.find(u => u.email === validatedData.email && u.isActive)
      if (mockUser) {
        console.log('Mock mode: Password reset email would be sent to:', validatedData.email)
      }
    }

    return NextResponse.json({
      message: 'パスワードリセットメールを送信しました。メールをご確認ください。',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'パスワードリセットの処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
