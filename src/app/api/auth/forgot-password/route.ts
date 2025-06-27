import { NextRequest, NextResponse } from 'next/server'
import { sendPasswordResetEmail } from '@/lib/auth/password-reset'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { MOCK_USERS } from '@/lib/mock-data'
import { z } from 'zod'

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
    const body = await request.json()
    const validatedData = forgotPasswordSchema.parse(body)

    if (isDatabaseAvailable()) {
      const user = await prisma!.user.findUnique({
        where: {
          email: validatedData.email,
          isActive: true,
        },
      })

      if (user) {
        try {
          // リクエストから動的にベースURLを取得
          const host = request.headers.get('host')
          const protocol = request.headers.get('x-forwarded-proto') || 'http'
          const baseUrl = host ? `${protocol}://${host}` : undefined

          console.log('Attempting to send password reset email:', {
            userId: user.id,
            email: user.email,
            userName: user.userName,
            host,
            protocol,
            baseUrl,
            envBaseUrl: process.env.NEXT_PUBLIC_BASE_URL,
          })

          await sendPasswordResetEmail(user.id, user.email, user.userName, baseUrl)
          console.log('Password reset email sent successfully')
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
