import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyToken, getUserById } from '@/lib/auth/auth'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { MOCK_USERS } from '@/lib/mock-data'

// プロフィール更新のバリデーションスキーマ
const updateProfileSchema = z.object({
  userName: z.string().min(3).max(50),
  displayName: z.string().max(100).optional().nullable(),
  skinType: z.string().max(50).optional().nullable(),
  profileImageUrl: z
    .string()
    .optional()
    .nullable()
    .refine(val => !val || val.startsWith('http://') || val.startsWith('https://'), {
      message: 'URLはhttp://またはhttps://で始まる必要があります',
    }),
})

export async function PUT(request: NextRequest) {
  try {
    // トークンの検証
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: 'トークンが無効です' }, { status: 401 })
    }

    // ユーザーの取得
    const user = await getUserById(decoded.id)

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    // リクエストボディの取得とバリデーション
    const body = await request.json()

    try {
      const validatedData = updateProfileSchema.parse(body)

      // モックモードまたはデモユーザーの場合
      if (!isDatabaseAvailable() || user.id.startsWith('demo-user')) {
        // モックユーザーの更新（実際には更新されない）
        const mockUserIndex = MOCK_USERS.findIndex(u => u.id === user.id)

        if (mockUserIndex !== -1) {
          // 実際のデータは更新しないが、成功レスポンスを返す
          return NextResponse.json({
            message: 'プロフィールを更新しました',
            user: {
              ...user,
              userName: validatedData.userName,
              displayName: validatedData.displayName || undefined,
              skinType: validatedData.skinType || undefined,
              profileImageUrl: validatedData.profileImageUrl || undefined,
            },
          })
        }

        return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
      }

      // データベースユーザーの更新
      const updatedUser = await prisma!.user.update({
        where: {
          id: user.id,
        },
        data: {
          userName: validatedData.userName,
          displayName: validatedData.displayName || null,
          skinType: validatedData.skinType || null,
          profileImageUrl: validatedData.profileImageUrl || null,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({
        message: 'プロフィールを更新しました',
        user: {
          id: updatedUser.id,
          userName: updatedUser.userName,
          email: updatedUser.email,
          displayName: updatedUser.displayName || undefined,
          skinType: updatedUser.skinType || undefined,
          profileImageUrl: updatedUser.profileImageUrl || undefined,
          emailVerified: updatedUser.emailVerified,
        },
      })
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: '入力データが無効です', details: validationError.errors },
          { status: 400 }
        )
      }
      throw validationError
    }
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'プロフィールの更新に失敗しました' }, { status: 500 })
  }
}
