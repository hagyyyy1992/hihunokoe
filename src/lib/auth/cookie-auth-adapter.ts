import { NextRequest, NextResponse } from 'next/server'

/**
 * Adapts cookie-based authentication to bearer token format for clean architecture
 */
export function adaptCookieToBearer(request: NextRequest): NextRequest {
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return request
  }

  // Clone the request with the Authorization header
  const headers = new Headers(request.headers)
  headers.set('Authorization', `Bearer ${token}`)

  return new NextRequest(request.url, {
    method: request.method,
    headers,
    body: request.body,
    // @ts-expect-error - NextRequest constructor doesn't expose all options
    duplex: 'half',
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

  const responseData = await response.json()
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
