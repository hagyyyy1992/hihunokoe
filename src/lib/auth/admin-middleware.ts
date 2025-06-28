import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isAdmin, AuthUser } from './auth'

export interface AdminRequest extends NextRequest {
  user?: AuthUser
  ip?: string
}

export function withAdminAuth(
  handler: (req: AdminRequest, context?: { params?: Record<string, string> }) => Promise<Response>
) {
  return async (
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ): Promise<Response> => {
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

    // Convert Promise<{ id: string }> to Record<string, string>
    const params = await context.params
    return handler(adminReq, { params })
  }
}

export function requireSuperAdmin(
  handler: (req: AdminRequest, context?: { params?: Record<string, string> }) => Promise<Response>
) {
  return async (
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ): Promise<Response> => {
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

    // Convert Promise<{ id: string }> to Record<string, string>
    const params = await context.params
    return handler(adminReq, { params })
  }
}
