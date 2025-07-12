import { NextRequest, NextResponse } from 'next/server'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  // テスト環境でのみ使用可能
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
  }

  // データベースが利用可能かチェック
  if (!isDatabaseAvailable() || !prisma) {
    return NextResponse.json({ error: 'Database is not available' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // ユーザーの利用規約・プライバシーポリシー同意をリセット
    const user = await prisma.user.update({
      where: { email },
      data: {
        termsAcceptedAt: null,
        privacyAcceptedAt: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Terms and privacy policy acceptance reset',
      userId: user.id,
    })
  } catch (error) {
    console.error('Error resetting terms:', error)
    return NextResponse.json({ error: 'Failed to reset terms' }, { status: 500 })
  }
}
