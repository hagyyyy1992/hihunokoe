import { NextRequest, NextResponse } from 'next/server'

/**
 * Adapts cookie-based authentication to bearer token format for clean architecture
 */
export function adaptCookieToBearer(request: Request): NextRequest {
  // NextRequestに変換
  const nextRequest = request as NextRequest

  // 既存のAuthorizationヘッダーをチェック
  const existingAuthHeader = request.headers.get('Authorization')
  if (existingAuthHeader) {
    console.log('[adaptCookieToBearer] Existing Authorization header found')
    // 既存のAuthorizationヘッダーがある場合は、そのまま返す
    return nextRequest
  }

  // Cookieからトークンを取得
  const token = nextRequest.cookies?.get('auth-token')?.value

  if (!token) {
    return nextRequest
  }

  // リクエストヘッダーをクローン
  const headers = new Headers(request.headers)
  headers.set('Authorization', `Bearer ${token}`)

  console.log('[adaptCookieToBearer] Setting Authorization header with token')

  // 新しいリクエストを作成
  const newUrl = new URL(request.url)
  const newRequest = new NextRequest(newUrl, {
    method: request.method,
    headers,
    body: request.body,
  })

  return newRequest
}

/**
 * Adapts clean architecture response to set cookies when needed
 */
export async function adaptResponseWithCookie(
  response: NextResponse,
  token?: string,
  action?: 'set' | 'delete'
): Promise<NextResponse> {
  if (!action) {
    return response
  }

  // Clone the response to avoid "Body is unusable" error
  const clonedResponse = response.clone()
  const responseData = await clonedResponse.json()
  const newResponse = NextResponse.json(responseData, {
    status: response.status,
    headers: response.headers,
  })

  if (action === 'set' && token) {
    newResponse.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })
  } else if (action === 'delete') {
    newResponse.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    })
  }

  return newResponse
}
