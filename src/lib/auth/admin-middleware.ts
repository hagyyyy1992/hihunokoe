import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isAdmin, AuthUser } from './auth'

export interface AdminRequest extends NextRequest {
  user?: AuthUser
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

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const adminReq = req as AdminRequest
    adminReq.user = user
    adminReq.ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    // Convert Promise<{ id: string }> to Record<string, string>
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

  console.log('checkAdminAuth: token found:', !!token)

  if (!token) {
    console.log('checkAdminAuth: no token found')
    return { isAuthenticated: false, admin: null }
  }

  try {
    const user = verifyToken(token)
    console.log('checkAdminAuth: user from token:', {
      hasUser: !!user,
      userId: user?.id,
      userRole: user?.role,
    })

    if (!user) {
      console.log('checkAdminAuth: invalid token')
      return { isAuthenticated: false, admin: null }
    }

    const adminStatus = isAdmin(user)
    console.log('checkAdminAuth: isAdmin result:', adminStatus)

    if (!adminStatus) {
      console.log('checkAdminAuth: user is not admin')
      return { isAuthenticated: false, admin: null }
    }

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

  if (!token) {
    return { isValid: false, user: null }
  }

  try {
    const user = verifyToken(token)
    if (!user || !isAdmin(user)) {
      return { isValid: false, user: null }
    }
    return { isValid: true, user }
  } catch {
    return { isValid: false, user: null }
  }
}
