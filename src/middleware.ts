import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// IP制限の設定を環境変数から取得
const ALLOWED_IPS = process.env.ALLOWED_IPS?.split(',').map(ip => ip.trim()) || []
const IP_RESTRICTION_ENABLED = process.env.IP_RESTRICTION_ENABLED === 'true'

// IP制限をスキップするパス（静的アセットなど）
const SKIP_PATHS = [
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/api/health', // ヘルスチェックエンドポイント
]

function getClientIp(request: NextRequest): string {
  // Vercelでは x-forwarded-for ヘッダーからIPを取得
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // カンマ区切りの場合は最初のIPを取得
    return forwardedFor.split(',')[0].trim()
  }

  // その他のヘッダーも確認
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  // Vercel特有のヘッダー
  const vercelIp = request.headers.get('x-vercel-forwarded-for')
  if (vercelIp) {
    return vercelIp.split(',')[0].trim()
  }

  return 'unknown'
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // スキップするパスの場合は処理しない
  if (SKIP_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // IP制限が有効な場合
  if (IP_RESTRICTION_ENABLED && ALLOWED_IPS.length > 0) {
    const clientIp = getClientIp(request)

    // デバッグ用ログ（本番環境では削除推奨）
    console.log('[IP Restriction] Client IP:', clientIp)
    console.log('[IP Restriction] Allowed IPs:', ALLOWED_IPS)

    // IPが許可リストにない場合
    if (!ALLOWED_IPS.includes(clientIp)) {
      // カスタムエラーページを返す
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html lang="ja">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>アクセス制限</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background-color: #f5f5f5;
              }
              .container {
                text-align: center;
                padding: 2rem;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                max-width: 400px;
              }
              h1 {
                color: #333;
                margin-bottom: 1rem;
              }
              p {
                color: #666;
                line-height: 1.6;
              }
              .ip {
                font-family: monospace;
                background: #f0f0f0;
                padding: 0.2rem 0.4rem;
                border-radius: 4px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>アクセス制限</h1>
              <p>申し訳ございませんが、お使いのIPアドレスからのアクセスは許可されていません。</p>
              <p>あなたのIPアドレス: <span class="ip">${clientIp}</span></p>
              <p>アクセスが必要な場合は、管理者にお問い合わせください。</p>
            </div>
          </body>
        </html>
        `,
        {
          status: 403,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        }
      )
    }
  }

  // IP制限をパスした場合は通常の処理を続行
  const response = NextResponse.next()

  // セキュリティヘッダーを追加
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

// ミドルウェアを適用するパスの設定
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/health (ヘルスチェック)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt
     * - sitemap.xml
     */
    '/((?!api/health|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
