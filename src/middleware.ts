import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateAdminAccess, getUserFromToken, hasAcceptedTerms } from '@/lib/auth/middleware-auth'

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

// 利用規約同意が必要な保護されたルート
const PROTECTED_ROUTES = [
  '/posts/new',
  '/posts/edit',
  '/profile',
  '/settings',
  '/api/profile',
  '/api/comments',
  '/api/empathy',
]

// HTTPメソッド別の保護ルート（GETは除外、POST/PUT/DELETE等のみ保護）
const PROTECTED_API_ROUTES = [
  '/api/posts', // POST/PUT/DELETE のみ保護、GETは許可
]

// 認証不要なパブリックルート
const PUBLIC_ROUTES = [
  '/',
  '/home',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/terms-agreement',
  '/legal/terms',
  '/legal/privacy',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/accept-terms',
  '/api/auth/resend-verification',
]

// GETメソッドで常に許可されるAPIルート（認証不要）
const GET_ALLOWED_API_ROUTES = ['/api/posts']

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

  // 管理画面の認証チェック
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!validateAdminAccess(request)) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // 利用規約同意チェック（保護されたルートのみ）
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  const isProtectedApiRoute = PROTECTED_API_ROUTES.some(route => pathname.startsWith(route))
  const isPublicRoute = PUBLIC_ROUTES.some(
    route => pathname === route || pathname.startsWith(route + '/')
  )
  const isGetAllowedApiRoute =
    GET_ALLOWED_API_ROUTES.some(route => pathname.startsWith(route)) && request.method === 'GET'

  // 保護されたAPIルートの場合、GETメソッドは許可
  const shouldProtectApiRoute = isProtectedApiRoute && request.method !== 'GET'

  // GETで許可されたAPIルートは常に通す
  if (isGetAllowedApiRoute) {
    // 何もしない、通す
  } else if ((isProtectedRoute || shouldProtectApiRoute) && !isPublicRoute) {
    const user = getUserFromToken(request)

    // 認証されていない場合はログインページへリダイレクト
    if (!user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // 利用規約に同意していない場合は同意ページへリダイレクト
    if (!hasAcceptedTerms(user)) {
      const termsUrl = new URL('/auth/terms-agreement', request.url)
      termsUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(termsUrl)
    }
  }

  // IP制限が有効な場合
  if (IP_RESTRICTION_ENABLED && ALLOWED_IPS.length > 0) {
    const clientIp = getClientIp(request)

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
