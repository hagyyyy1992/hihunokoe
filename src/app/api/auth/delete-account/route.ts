import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, deleteUserAccount, loginUser } from '@/lib/auth/auth'
import {
  sendEmail,
  generateAccountDeletionEmailHtml,
  generateAccountDeletionEmailText,
} from '@/lib/email/email'
import { SERVICE_NAME } from '@/lib/constants'

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

    let requestBody
    try {
      requestBody = await request.json()
    } catch (error) {
      console.error('Failed to parse request body:', error)
      return NextResponse.json({ error: 'リクエストボディが無効です' }, { status: 400 })
    }

    const { password } = requestBody
    if (!password) {
      return NextResponse.json({ error: 'パスワードの確認が必要です' }, { status: 400 })
    }

    // パスワードを検証
    const authenticatedUser = await loginUser({ email: user.email, password })
    if (!authenticatedUser) {
      return NextResponse.json({ error: 'パスワードが正しくありません' }, { status: 401 })
    }

    // アカウント削除を実行
    await deleteUserAccount(user.id)

    // 削除完了メールを送信
    try {
      await sendEmail({
        to: user.email,
        subject: `${SERVICE_NAME} アカウント削除完了のお知らせ`,
        html: generateAccountDeletionEmailHtml(user.userName),
        text: generateAccountDeletionEmailText(user.userName),
      })
    } catch (emailError) {
      console.error('Failed to send account deletion email:', emailError)
      // メール送信失敗してもアカウント削除は成功とする
    }

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
