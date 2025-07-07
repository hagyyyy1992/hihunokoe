import { NextRequest, NextResponse } from 'next/server'

export class HealthController {
  async checkHealth(request: NextRequest): Promise<NextResponse> {
    // クライアントのIPアドレスを取得
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const vercelIp = request.headers.get('x-vercel-forwarded-for')

    const clientIp =
      forwardedFor?.split(',')[0].trim() ||
      realIp?.trim() ||
      vercelIp?.split(',')[0].trim() ||
      'unknown'

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      clientIp: clientIp,
      headers: {
        'x-forwarded-for': forwardedFor,
        'x-real-ip': realIp,
        'x-vercel-forwarded-for': vercelIp,
      },
    })
  }

  async checkPostsApi(request: NextRequest): Promise<NextResponse> {
    return NextResponse.json({
      message: 'Posts API is working',
      timestamp: new Date().toISOString(),
    })
  }
}
