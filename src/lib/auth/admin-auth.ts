import { NextRequest, NextResponse } from 'next/server'
import { AdminAuthController } from '@api/framework/controllers/AdminAuthController'

export interface AdminUser {
  id: string
  adminName: string
  email: string
  role: 'ADMIN' | 'SUPER_ADMIN'
}

export interface AdminRequest extends NextRequest {
  admin?: AdminUser
  ip?: string
}

let adminAuthController: AdminAuthController | null = null

try {
  adminAuthController = new AdminAuthController()
} catch (error) {
  console.error('Failed to initialize AdminAuthController for middleware:', error)
}

export async function verifyAdminToken(token: string): Promise<AdminUser | null> {
  if (!adminAuthController) {
    console.error('AdminAuthController not available')
    return null
  }

  try {
    const mockRequest = new NextRequest('http://localhost:3000/api/admin/auth/verify', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const response = await adminAuthController.verifyToken(mockRequest)
    const data = await response.json()

    if (data.success && data.user) {
      return data.user as AdminUser
    }

    return null
  } catch (error) {
    console.error('Admin token verification error:', error)
    return null
  }
}

export function isAdmin(admin: AdminUser): boolean {
  return admin.role === 'ADMIN' || admin.role === 'SUPER_ADMIN'
}

export function isSuperAdmin(admin: AdminUser): boolean {
  return admin.role === 'SUPER_ADMIN'
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

    const admin = await verifyAdminToken(token)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }

    const adminReq = req as AdminRequest
    adminReq.admin = admin
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

    const admin = await verifyAdminToken(token)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }

    if (!isSuperAdmin(admin)) {
      return NextResponse.json(
        { error: 'Forbidden - Super admin access required' },
        { status: 403 }
      )
    }

    const adminReq = req as AdminRequest
    adminReq.admin = admin
    adminReq.ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    const params = await context.params
    return handler(adminReq, { params })
  }
}

export async function checkAdminAuth(request: NextRequest): Promise<{
  isAuthenticated: boolean
  admin: AdminUser | null
}> {
  const token =
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    request.cookies.get('admin-auth-token')?.value

  if (!token) {
    return { isAuthenticated: false, admin: null }
  }

  try {
    const admin = await verifyAdminToken(token)
    if (!admin) {
      return { isAuthenticated: false, admin: null }
    }

    return { isAuthenticated: true, admin }
  } catch (error) {
    console.error('checkAdminAuth: error verifying token:', error)
    return { isAuthenticated: false, admin: null }
  }
}
