import { NextRequest, NextResponse } from 'next/server'
import { AuthController } from '@api/framework/controllers/AuthController'
import { cookies } from 'next/headers'

const authController = new AuthController()

export async function POST(request: NextRequest) {
  const response = await authController.login(request)

  // レスポンスのステータスをチェック
  if (response.status === 200) {
    // レスポンスをクローンして複数回読み取れるようにする
    const clonedResponse = response.clone()
    const responseData = await clonedResponse.json()

    if (responseData.token) {
      // クッキーストアを取得（Next.js 15では非同期）
      const cookieStore = await cookies()

      // クッキーを設定
      cookieStore.set('auth-token', responseData.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      })

      console.log(
        '[Login Route] Setting cookie for token:',
        responseData.token.substring(0, 20) + '...'
      ) // デバッグログ

      // レスポンスデータを返す
      return NextResponse.json(responseData)
    } else {
      console.log('[Login Route] No token in response data') // デバッグログ
    }
  }

  return response
}
