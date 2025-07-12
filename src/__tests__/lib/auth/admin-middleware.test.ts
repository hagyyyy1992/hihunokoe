import { NextRequest } from 'next/server'
import { UserRole } from '@prisma/client'
import { withAdminAuth, requireSuperAdmin, AdminRequest } from '@/lib/auth/admin-middleware'
import { verifyToken, isAdmin } from '@/lib/auth/auth'

// Mock dependencies
jest.mock('@/lib/auth/auth')

const mockedVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>
const mockedIsAdmin = isAdmin as jest.MockedFunction<typeof isAdmin>

describe('admin-middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('withAdminAuth', () => {
    const mockHandler = jest.fn()

    beforeEach(() => {
      mockHandler.mockClear()
      mockHandler.mockResolvedValue(new Response('Success', { status: 200 }))
    })

    it('should return 401 when no token is provided', async () => {
      const req = new NextRequest('http://localhost/api/admin/test')
      const context = { params: Promise.resolve({ id: 'test' }) }

      const wrappedHandler = withAdminAuth(mockHandler)
      const response = await wrappedHandler(req, context)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({ error: 'Unauthorized - No token provided' })
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should authenticate with Authorization header', async () => {
      const req = new NextRequest('http://localhost/api/admin/test', {
        headers: {
          authorization: 'Bearer valid-token',
        },
      })
      const context = { params: Promise.resolve({ id: 'test' }) }

      const mockUser = {
        id: 'admin-1',
        userName: 'admin',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      }

      mockedVerifyToken.mockReturnValue(mockUser)
      mockedIsAdmin.mockReturnValue(true)

      const wrappedHandler = withAdminAuth(mockHandler)
      const response = await wrappedHandler(req, context)

      expect(mockedVerifyToken).toHaveBeenCalledWith('valid-token')
      expect(mockedIsAdmin).toHaveBeenCalledWith(mockUser)
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
          ip: 'unknown',
        }),
        { params: { id: 'test' } }
      )
      expect(response.status).toBe(200)
    })

    it('should authenticate with admin-auth-token cookie', async () => {
      const req = new NextRequest('http://localhost/api/admin/test', {
        headers: {
          cookie: 'admin-auth-token=cookie-token; other=value',
        },
      })
      const context = { params: Promise.resolve({ id: 'test' }) }

      const mockUser = {
        id: 'admin-1',
        userName: 'admin',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      }

      mockedVerifyToken.mockReturnValue(mockUser)
      mockedIsAdmin.mockReturnValue(true)

      const wrappedHandler = withAdminAuth(mockHandler)
      const response = await wrappedHandler(req, context)

      expect(mockedVerifyToken).toHaveBeenCalledWith('cookie-token')
      expect(response.status).toBe(200)
    })

    it('should return 401 when token is invalid', async () => {
      const req = new NextRequest('http://localhost/api/admin/test', {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      })
      const context = { params: Promise.resolve({ id: 'test' }) }

      mockedVerifyToken.mockReturnValue(null)

      const wrappedHandler = withAdminAuth(mockHandler)
      const response = await wrappedHandler(req, context)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({ error: 'Unauthorized - Invalid token' })
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should return 403 when user is not admin', async () => {
      const req = new NextRequest('http://localhost/api/admin/test', {
        headers: {
          authorization: 'Bearer user-token',
        },
      })
      const context = { params: Promise.resolve({ id: 'test' }) }

      const mockUser = {
        id: 'user-1',
        userName: 'user',
        email: 'user@example.com',
        role: UserRole.USER,
      }

      mockedVerifyToken.mockReturnValue(mockUser)
      mockedIsAdmin.mockReturnValue(false)

      const wrappedHandler = withAdminAuth(mockHandler)
      const response = await wrappedHandler(req, context)

      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body).toEqual({ error: 'Forbidden - Admin access required' })
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should extract IP address from x-forwarded-for header', async () => {
      const req = new NextRequest('http://localhost/api/admin/test', {
        headers: {
          authorization: 'Bearer valid-token',
          'x-forwarded-for': '192.168.1.1',
        },
      })
      const context = { params: Promise.resolve({ id: 'test' }) }

      const mockUser = {
        id: 'admin-1',
        userName: 'admin',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      }

      mockedVerifyToken.mockReturnValue(mockUser)
      mockedIsAdmin.mockReturnValue(true)

      const wrappedHandler = withAdminAuth(mockHandler)
      await wrappedHandler(req, context)

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: '192.168.1.1',
        }),
        { params: { id: 'test' } }
      )
    })

    it('should extract IP address from x-real-ip header when x-forwarded-for is not available', async () => {
      const req = new NextRequest('http://localhost/api/admin/test', {
        headers: {
          authorization: 'Bearer valid-token',
          'x-real-ip': '10.0.0.1',
        },
      })
      const context = { params: Promise.resolve({ id: 'test' }) }

      const mockUser = {
        id: 'admin-1',
        userName: 'admin',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      }

      mockedVerifyToken.mockReturnValue(mockUser)
      mockedIsAdmin.mockReturnValue(true)

      const wrappedHandler = withAdminAuth(mockHandler)
      await wrappedHandler(req, context)

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: '10.0.0.1',
        }),
        { params: { id: 'test' } }
      )
    })

    it('should handle complex params object', async () => {
      const req = new NextRequest('http://localhost/api/admin/test', {
        headers: {
          authorization: 'Bearer valid-token',
        },
      })
      const context = { params: Promise.resolve({ id: 'test', category: 'users' }) }

      const mockUser = {
        id: 'admin-1',
        userName: 'admin',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      }

      mockedVerifyToken.mockReturnValue(mockUser)
      mockedIsAdmin.mockReturnValue(true)

      const wrappedHandler = withAdminAuth(mockHandler)
      await wrappedHandler(req, context)

      expect(mockHandler).toHaveBeenCalledWith(expect.any(Object), {
        params: { id: 'test', category: 'users' },
      })
    })
  })

  describe('requireSuperAdmin', () => {
    const mockHandler = jest.fn()

    beforeEach(() => {
      mockHandler.mockClear()
      mockHandler.mockResolvedValue(new Response('Success', { status: 200 }))
    })

    it('should return 401 when no token is provided', async () => {
      const req = new NextRequest('http://localhost/api/admin/super/test')
      const context = { params: Promise.resolve({ id: 'test' }) }

      const wrappedHandler = requireSuperAdmin(mockHandler)
      const response = await wrappedHandler(req, context)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({ error: 'Unauthorized - No token provided' })
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should authenticate super admin with Authorization header', async () => {
      const req = new NextRequest('http://localhost/api/admin/super/test', {
        headers: {
          authorization: 'Bearer super-admin-token',
        },
      })
      const context = { params: Promise.resolve({ id: 'test' }) }

      const mockUser = {
        id: 'super-admin-1',
        userName: 'superadmin',
        email: 'superadmin@example.com',
        role: UserRole.SUPER_ADMIN,
      }

      mockedVerifyToken.mockReturnValue(mockUser)

      const wrappedHandler = requireSuperAdmin(mockHandler)
      const response = await wrappedHandler(req, context)

      expect(mockedVerifyToken).toHaveBeenCalledWith('super-admin-token')
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
          ip: 'unknown',
        }),
        { params: { id: 'test' } }
      )
      expect(response.status).toBe(200)
    })

    it('should authenticate super admin with admin-auth-token cookie', async () => {
      const req = new NextRequest('http://localhost/api/admin/super/test', {
        headers: {
          cookie: 'admin-auth-token=super-cookie-token; other=value',
        },
      })
      const context = { params: Promise.resolve({ id: 'test' }) }

      const mockUser = {
        id: 'super-admin-1',
        userName: 'superadmin',
        email: 'superadmin@example.com',
        role: UserRole.SUPER_ADMIN,
      }

      mockedVerifyToken.mockReturnValue(mockUser)

      const wrappedHandler = requireSuperAdmin(mockHandler)
      const response = await wrappedHandler(req, context)

      expect(mockedVerifyToken).toHaveBeenCalledWith('super-cookie-token')
      expect(response.status).toBe(200)
    })

    it('should return 401 when token is invalid', async () => {
      const req = new NextRequest('http://localhost/api/admin/super/test', {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      })
      const context = { params: Promise.resolve({ id: 'test' }) }

      mockedVerifyToken.mockReturnValue(null)

      const wrappedHandler = requireSuperAdmin(mockHandler)
      const response = await wrappedHandler(req, context)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({ error: 'Unauthorized - Invalid token' })
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should return 403 when user is regular admin (not super admin)', async () => {
      const req = new NextRequest('http://localhost/api/admin/super/test', {
        headers: {
          authorization: 'Bearer admin-token',
        },
      })
      const context = { params: Promise.resolve({ id: 'test' }) }

      const mockUser = {
        id: 'admin-1',
        userName: 'admin',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      }

      mockedVerifyToken.mockReturnValue(mockUser)

      const wrappedHandler = requireSuperAdmin(mockHandler)
      const response = await wrappedHandler(req, context)

      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body).toEqual({ error: 'Forbidden - Super admin access required' })
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should return 403 when user is regular user', async () => {
      const req = new NextRequest('http://localhost/api/admin/super/test', {
        headers: {
          authorization: 'Bearer user-token',
        },
      })
      const context = { params: Promise.resolve({ id: 'test' }) }

      const mockUser = {
        id: 'user-1',
        userName: 'user',
        email: 'user@example.com',
        role: UserRole.USER,
      }

      mockedVerifyToken.mockReturnValue(mockUser)

      const wrappedHandler = requireSuperAdmin(mockHandler)
      const response = await wrappedHandler(req, context)

      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body).toEqual({ error: 'Forbidden - Super admin access required' })
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should extract IP address properly', async () => {
      const req = new NextRequest('http://localhost/api/admin/super/test', {
        headers: {
          authorization: 'Bearer super-admin-token',
          'x-forwarded-for': '203.0.113.1, 192.168.1.1',
        },
      })
      const context = { params: Promise.resolve({ id: 'test' }) }

      const mockUser = {
        id: 'super-admin-1',
        userName: 'superadmin',
        email: 'superadmin@example.com',
        role: UserRole.SUPER_ADMIN,
      }

      mockedVerifyToken.mockReturnValue(mockUser)

      const wrappedHandler = requireSuperAdmin(mockHandler)
      await wrappedHandler(req, context)

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: '203.0.113.1, 192.168.1.1',
        }),
        { params: { id: 'test' } }
      )
    })

    it('should handle handler that throws an error', async () => {
      const req = new NextRequest('http://localhost/api/admin/super/test', {
        headers: {
          authorization: 'Bearer super-admin-token',
        },
      })
      const context = { params: Promise.resolve({ id: 'test' }) }

      const mockUser = {
        id: 'super-admin-1',
        userName: 'superadmin',
        email: 'superadmin@example.com',
        role: UserRole.SUPER_ADMIN,
      }

      mockedVerifyToken.mockReturnValue(mockUser)
      mockHandler.mockRejectedValue(new Error('Handler error'))

      const wrappedHandler = requireSuperAdmin(mockHandler)

      await expect(wrappedHandler(req, context)).rejects.toThrow('Handler error')
    })
  })

  describe('AdminRequest interface', () => {
    it('should extend NextRequest with user and ip properties', () => {
      // This is a type test to ensure AdminRequest interface is properly defined
      const req = new NextRequest('http://localhost/test') as AdminRequest

      // These should be assignable without TypeScript errors
      req.user = {
        id: 'test-id',
        userName: 'test-user',
        email: 'test@example.com',
        role: UserRole.ADMIN,
      }
      req.ip = '127.0.0.1'

      expect(req.user).toBeDefined()
      expect(req.ip).toBeDefined()
    })
  })
})
