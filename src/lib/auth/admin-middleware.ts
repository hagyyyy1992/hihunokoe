import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isAdmin as isUserAdmin, AuthUser } from './auth'
import { verifyAdminToken as verifyAdminUserToken, AdminUser } from './admin-auth'

export interface AdminRequest extends NextRequest {
  user?: AuthUser
  admin?: AdminUser
  ip?: string
}

export function withAdminAuth<T = Record<string, string>>(
  handler: (req: AdminRequest, context: { params: T }) => Promise<Response>
) {
  return async (req: NextRequest, context: { params: Promise<T> }): Promise<Response> => {
    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('admin-auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
    }

    // Try AdminUser table first
    const admin = await verifyAdminUserToken(token)
    if (admin) {
      const adminReq = req as AdminRequest
      adminReq.admin = admin
      adminReq.ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      const params = await context.params
      return handler(adminReq, { params })
    }

    // Fallback to User table for backward compatibility
    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }

    if (!isUserAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const adminReq = req as AdminRequest
    adminReq.user = user
    adminReq.ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    const params = await context.params
    return handler(adminReq, { params })
  }
}

export function requireSuperAdmin<T = Record<string, string>>(
  handler: (req: AdminRequest, context: { params: T }) => Promise<Response>
) {
  return async (req: NextRequest, context: { params: Promise<T> }): Promise<Response> => {
    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('admin-auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Super admin access required' },
        { status: 403 }
      )
    }

    const adminReq = req as AdminRequest
    adminReq.user = user
    adminReq.ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    // Convert Promise<{ id: string }> to Record<string, string>
    const params = await context.params
    return handler(adminReq, { params })
  }
}

export async function checkAdminAuth(request: NextRequest): Promise<{
  isAuthenticated: boolean
  admin: AuthUser | null
}> {
  const token =
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    request.cookies.get('admin-auth-token')?.value

  if (!token) {
    return { isAuthenticated: false, admin: null }
  }

  try {
    const user = verifyToken(token)
    if (!user) return { isAuthenticated: false, admin: null }
    const adminStatus = isUserAdmin(user)
    if (!adminStatus) return { isAuthenticated: false, admin: null }
    return { isAuthenticated: true, admin: user }
  } catch (error) {
    console.error('checkAdminAuth: error verifying token:', error)
    return { isAuthenticated: false, admin: null }
  }
}

// 管理者トークンを検証するシンプルな関数
export async function verifyAdminToken(request: NextRequest): Promise<{
  isValid: boolean
  user: AuthUser | null
}> {
  const token =
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    request.cookies.get('admin-auth-token')?.value
  if (!token) return { isValid: false, user: null }
  try {
    const user = verifyToken(token)
    if (!user || !isUserAdmin(user)) return { isValid: false, user: null }
    return { isValid: true, user }
  } catch {
    return { isValid: false, user: null }
  }
}
