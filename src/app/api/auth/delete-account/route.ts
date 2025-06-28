import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, deleteUserAccount } from '@/lib/auth/auth'

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: '無効なトークンです' }, { status: 401 })
    }

    const { password } = await request.json()
    if (!password) {
      return NextResponse.json({ error: 'パスワードの確認が必要です' }, { status: 400 })
    }

    // アカウント削除を実行
    await deleteUserAccount(user.id)

    // レスポンスにSet-Cookieヘッダーを追加してトークンを削除
    const response = NextResponse.json(
      { message: 'アカウントが正常に削除されました' },
      { status: 200 }
    )

    // トークンクッキーを削除
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0), // 即座に期限切れにする
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'アカウント削除に失敗しました' },
      { status: 500 }
    )
  }
}
