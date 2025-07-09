import { NextRequest, NextResponse } from 'next/server'

/**
 * Adapts cookie-based authentication to bearer token format for clean architecture
 */
export function adaptCookieToBearer(request: Request): NextRequest {
  // NextRequestに変換
  const nextRequest = request as NextRequest
  const token = nextRequest.cookies?.get('auth-token')?.value

  if (!token) {
    return nextRequest
  }

  // リクエストヘッダーをクローン
  const headers = new Headers(request.headers)
  headers.set('Authorization', `Bearer ${token}`)

  // NextRequestとして新しいリクエストを作成
  // NextRequestのコンストラクタを使用して、cookiesなどの情報を保持
  const newRequest = new NextRequest(request.url, {
    method: request.method,
    headers,
    body: request.body,
    // @ts-expect-error - NextRequestの内部プロパティ
    cookies: nextRequest.cookies,
    // @ts-expect-error - NextRequestの内部プロパティ
    geo: nextRequest.geo,
    // @ts-expect-error - NextRequestの内部プロパティ
    ip: nextRequest.ip,
    nextUrl: nextRequest.nextUrl,
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
