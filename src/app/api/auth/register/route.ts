import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth/auth'
import { sendVerificationEmail } from '@/lib/auth/email-verification'
import { z } from 'zod'
import { SkinType, Gender, AllergyType, BodyType } from '@prisma/client'

const registerSchema = z.object({
  userName: z.string().min(3).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  birthDate: z
    .string()
    .optional()
    .transform(val => (val ? new Date(val) : undefined)),
  gender: z.nativeEnum(Gender).optional(),
  skinType: z.nativeEnum(SkinType).optional(),
  skinTypeOther: z.string().max(100).optional(),
  allergies: z.array(z.nativeEnum(AllergyType)).optional(),
  allergiesOther: z.string().optional(),
  bodyType: z.nativeEnum(BodyType).optional(),
  bodyTypeOther: z.string().max(100).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validatedData = registerSchema.parse(body)

    // ユーザー名とメールアドレスの重複チェックは Prisma のユニーク制約で行われる
    const user = await registerUser(validatedData)

    try {
      // リクエストから動的にベースURLを取得
      const host = request.headers.get('host')
      const protocol = request.headers.get('x-forwarded-proto') || 'http'
      const baseUrl = host ? `${protocol}://${host}` : undefined

      await sendVerificationEmail(user.id, user.email, user.userName, baseUrl)
    } catch (emailError) {
      console.error('Failed to send verification email:', {
        error: emailError,
        message: emailError instanceof Error ? emailError.message : 'Unknown error',
        stack: emailError instanceof Error ? emailError.stack : undefined,
        userId: user.id,
        email: user.email,
      })

      // エラーメッセージを返すが、ユーザー登録自体は成功扱いとする
      return NextResponse.json(
        {
          user: {
            id: user.id,
            userName: user.userName,
            email: user.email,
            emailVerified: false,
          },
          error:
            'ユーザー登録は完了しましたが、確認メールの送信に失敗しました。後ほど再送信をお試しください。',
          message: 'ユーザー登録は完了しました。',
        },
        { status: 201 }
      )
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        userName: user.userName,
        email: user.email,
        birthDate: user.birthDate,
        gender: user.gender,
        skinType: user.skinType,
        skinTypeOther: user.skinTypeOther,
        allergies: user.allergies,
        allergiesOther: user.allergiesOther,
        bodyType: user.bodyType,
        bodyTypeOther: user.bodyTypeOther,
        emailVerified: user.emailVerified,
      },
      message: 'ユーザー登録が完了しました。確認メールをご確認ください。',
    })

    return response
  } catch (error: unknown) {
    // P2002 (重複エラー) は想定される動作のため、debug レベルでログ出力
    if (
      !(
        (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') ||
        (error instanceof Error &&
          error.message.includes('ユーザー名またはメールアドレスが既に使用されています'))
      )
    ) {
      console.error('Registration error:', error)
    }

    if (
      (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') ||
      (error instanceof Error &&
        error.message.includes('ユーザー名またはメールアドレスが既に使用されています'))
    ) {
      return NextResponse.json(
        { error: 'ユーザー名またはメールアドレスが既に使用されています' },
        { status: 400 }
      )
    }

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

    return NextResponse.json({ error: 'ユーザー登録に失敗しました' }, { status: 500 })
  }
}
