import { NextRequest, NextResponse } from 'next/server'

/**
 * Adapts cookie-based authentication to bearer token format for clean architecture
 */
export function adaptCookieToBearer(request: Request): Request {
  // NextRequestに変換
  const nextRequest = request as NextRequest
  const token = nextRequest.cookies?.get('auth-token')?.value

  if (!token) {
    return request
  }

  // リクエストヘッダーをクローン
  const headers = new Headers(request.headers)
  headers.set('Authorization', `Bearer ${token}`)

  // 新しいRequestオブジェクトを作成
  return new Request(request.url, {
    method: request.method,
    headers,
    body: request.body,
    mode: request.mode,
    credentials: request.credentials,
    cache: request.cache,
    redirect: request.redirect,
    referrer: request.referrer,
    integrity: request.integrity,
  })
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
