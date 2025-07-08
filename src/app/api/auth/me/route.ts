import { NextRequest } from 'next/server'
import { AuthController } from '@api/framework/controllers/AuthController'
import { adaptCookieToBearer } from '@/lib/auth/cookie-auth-adapter'

const authController = new AuthController()

export async function GET(request: Request) {
  // E2E環境では一時的にレガシー実装を使用（セッション共有の問題を回避）
  if (process.env.NODE_ENV === 'test') {
    const { GET: legacyGet } = await import('./route-legacy')
    return legacyGet(request as NextRequest)
  }

  const adaptedRequest = adaptCookieToBearer(request)
  return authController.getCurrentUser(adaptedRequest as NextRequest)
}
