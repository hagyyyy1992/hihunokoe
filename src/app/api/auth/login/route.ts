import { NextRequest, NextResponse } from 'next/server'
import { AuthController } from '@api/framework/controllers/AuthController'

const authController = new AuthController()

export async function POST(request: NextRequest) {
  const response = await authController.login(request)

  // レスポンスのステータスをチェック
  if (response.status === 200) {
    // レスポンスをクローンして複数回読み取れるようにする
    const clonedResponse = response.clone()
    const responseData = await clonedResponse.json()
    if (responseData.token) {
      // トークンが返された場合、新しいレスポンスを作成してクッキーを設定
      const newResponse = NextResponse.json(responseData)
      newResponse.cookies.set('auth-token', responseData.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      })
      return newResponse
    }
  }

  return response
}
