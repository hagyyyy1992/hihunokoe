import { NextRequest, NextResponse } from 'next/server'
import { AuthControllerFactory } from '@api/framework/factories/AuthControllerFactory'
import { adaptCookieToBearer } from '@/lib/auth/cookie-auth-adapter'

export async function POST(request: Request) {
  const authController = AuthControllerFactory.create()
  const adaptedRequest = adaptCookieToBearer(request)
  const response = await authController.logout(adaptedRequest as NextRequest)

  // ログアウト成功時はクッキーを削除
  if (response.status === 200) {
    const clonedResponse = response.clone()
    const responseData = await clonedResponse.json()
    const newResponse = NextResponse.json(responseData)

    // クッキーを削除
    newResponse.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return newResponse
  }

  return response
}
