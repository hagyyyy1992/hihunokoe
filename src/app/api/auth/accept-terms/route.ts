import { NextRequest, NextResponse } from 'next/server'
import { AuthControllerFactory } from '@api/framework/factories/AuthControllerFactory'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const controller = AuthControllerFactory.create()

  try {
    // 認証トークンを取得
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth-token')?.value

    if (!authToken) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // トークンからユーザー情報を取得
    const meRequest = new NextRequest(request.url, {
      method: 'GET',
      headers: {
        ...request.headers,
        authorization: `Bearer ${authToken}`,
      },
    })
    const meResponse = await controller.getCurrentUser(meRequest)
    const userData = await meResponse.json()

    if (!userData.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const { termsAccepted, privacyAccepted } = body

    if (!termsAccepted || !privacyAccepted) {
      return NextResponse.json(
        { error: '利用規約とプライバシーポリシーの両方に同意してください' },
        { status: 400 }
      )
    }

    // データベースが利用可能かチェック
    if (!isDatabaseAvailable() || !prisma) {
      return NextResponse.json({ error: 'データベースが利用できません' }, { status: 503 })
    }

    // ユーザーの同意日時を更新
    const updatedUser = await prisma.user.update({
      where: { id: userData.user.id },
      data: {
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      },
    })

    // 新しいトークンを生成（同意日時を含む）
    const { TokenServiceImpl } = await import('@api/interface-adapters/services/TokenServiceImpl')
    const tokenService = new TokenServiceImpl()

    const newToken = await tokenService.generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role || 'USER',
      userName: updatedUser.userName || undefined,
      termsAcceptedAt: updatedUser.termsAcceptedAt?.toISOString() ?? null,
      privacyAcceptedAt: updatedUser.privacyAcceptedAt?.toISOString() ?? null,
    })

    // レスポンスを作成
    const response = NextResponse.json({
      success: true,
      message: '利用規約とプライバシーポリシーに同意しました',
    })

    // 新しいトークンでCookieを更新
    response.cookies.set('auth-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Accept terms error:', error)
    return NextResponse.json({ error: '同意の処理に失敗しました' }, { status: 500 })
  }
}
