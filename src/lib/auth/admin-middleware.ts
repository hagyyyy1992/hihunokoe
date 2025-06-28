import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isAdmin, AuthUser } from './auth'

export interface AdminRequest extends NextRequest {
  user?: AuthUser
  ip?: string
}

export function withAdminAuth<T = Record<string, string>>(
  handler: (req: AdminRequest, context: { params: Promise<T> }) => Promise<Response>
) {
  return async (req: NextRequest, context: { params: Promise<T> }): Promise<Response> => {
    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('auth-token')?.value

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

    return handler(adminReq, context)
  }
}

export function requireSuperAdmin<T = Record<string, string>>(
  handler: (req: AdminRequest, context: { params: Promise<T> }) => Promise<Response>
) {
  return async (req: NextRequest, context: { params: Promise<T> }): Promise<Response> => {
    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('auth-token')?.value

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

    return handler(adminReq, context)
  }
}
