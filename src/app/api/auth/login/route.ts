import { NextRequest, NextResponse } from 'next/server'
import { AuthControllerFactory } from '@api/framework/factories/AuthControllerFactory'
import { getClientIpAddress } from '@/lib/utils/get-ip-address'

export async function POST(request: NextRequest) {
  const authController = AuthControllerFactory.create()

  // IPアドレスを取得
  const ipAddress = await getClientIpAddress()

  // リクエストをクローンしてIPアドレスを追加
  const body = await request.json()
  const modifiedRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({
      ...body,
      ipAddress,
    }),
  })

  const response = await authController.login(modifiedRequest)

  // レスポンスのステータスをチェック
  if (response.status === 200) {
    // レスポンスをクローンして複数回読み取れるようにする
    const clonedResponse = response.clone()
    const responseData = await clonedResponse.json()

    if (responseData.token) {
      // NextResponseを作成してクッキーを設定
      const nextResponse = NextResponse.json(responseData)

      // クッキーを設定（NextResponseのcookiesメソッドを使用）
      nextResponse.cookies.set('auth-token', responseData.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      })

      // ユーザーが利用規約に同意していない場合は、同意ページへのリダイレクトを指示
      if (
        responseData.user &&
        (!responseData.user.termsAcceptedAt || !responseData.user.privacyAcceptedAt)
      ) {
        const termsResponse = NextResponse.json({
          ...responseData,
          requiresTermsAgreement: true,
          redirectTo: '/auth/terms-agreement',
        })

        // 利用規約同意が必要な場合でもクッキーは設定
        termsResponse.cookies.set('auth-token', responseData.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: '/',
        })

        return termsResponse
      }

      // クッキー付きレスポンスデータを返す
      return nextResponse
    }
  }

  return response
}
