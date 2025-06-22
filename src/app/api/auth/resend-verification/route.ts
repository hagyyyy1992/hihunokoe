import { NextRequest, NextResponse } from 'next/server'
import { resendVerificationEmail } from '@/lib/auth/email-verification'
import { z } from 'zod'

const resendSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = resendSchema.parse(body)

    const result = await resendVerificationEmail(validatedData.email)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({ message: result.message })
  } catch (error) {
    console.error('Resend verification email error:', error)

    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'メールアドレスの形式が正しくありません' }, { status: 400 })
    }

    return NextResponse.json({ error: '確認メールの再送信に失敗しました' }, { status: 500 })
  }
}
