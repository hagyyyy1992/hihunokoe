import { NextRequest } from 'next/server'

interface TokenPayload {
  id: string
  userName: string
  email: string
  role: string
  iat: number
  exp: number
}

// 簡易JWT検証（署名検証なし - ミドルウェア用）
function verifyTokenMiddleware(token: string): TokenPayload | null {
  try {
    // JWTトークンの基本構造をチェック
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // ペイロードを取得してデコード
    const payload = parts[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as TokenPayload

    // 有効期限をチェック
    const now = Math.floor(Date.now() / 1000)
    if (decoded.exp && decoded.exp < now) {
      return null
    }

    return decoded
  } catch {
    return null
  }
}

export function validateAdminAccess(request: NextRequest): boolean {
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return false
  }

  const user = verifyTokenMiddleware(token)

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return false
  }

  return true
}
