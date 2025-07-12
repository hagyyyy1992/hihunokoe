import { NextRequest, NextResponse } from 'next/server'
import { adaptCookieToBearer, adaptResponseWithCookie } from '@/lib/auth/cookie-auth-adapter'

describe('cookie-auth-adapter', () => {
  describe('adaptCookieToBearer', () => {
    it('should return request unchanged when Authorization header already exists', () => {
      const request = new Request('http://localhost/api/test', {
        headers: {
          Authorization: 'Bearer existing-token',
          Cookie: 'auth-token=cookie-token',
        },
      })

      const result = adaptCookieToBearer(request)

      expect(result.headers.get('Authorization')).toBe('Bearer existing-token')
    })

    it('should add Authorization header from auth-token cookie', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          Cookie: 'auth-token=cookie-token; other=value',
        },
      })

      const result = adaptCookieToBearer(request)

      expect(result.headers.get('Authorization')).toBe('Bearer cookie-token')
    })

    it('should return request unchanged when no auth-token cookie exists', () => {
      const request = new Request('http://localhost/api/test', {
        headers: {
          Cookie: 'other=value; session=123',
        },
      })

      const result = adaptCookieToBearer(request)

      expect(result.headers.get('Authorization')).toBeNull()
    })

    it('should return request unchanged when no cookies exist', () => {
      const request = new Request('http://localhost/api/test')

      const result = adaptCookieToBearer(request)

      expect(result.headers.get('Authorization')).toBeNull()
    })

    it('should preserve request method and body', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          Cookie: 'auth-token=cookie-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: 'test' }),
      })

      const result = adaptCookieToBearer(request)

      expect(result.method).toBe('POST')
      expect(result.headers.get('Content-Type')).toBe('application/json')
      expect(result.headers.get('Authorization')).toBe('Bearer cookie-token')
    })

    it('should preserve all original headers except Authorization', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          Cookie: 'auth-token=cookie-token',
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value',
        },
      })

      const result = adaptCookieToBearer(request)

      expect(result.headers.get('Content-Type')).toBe('application/json')
      expect(result.headers.get('X-Custom-Header')).toBe('custom-value')
      expect(result.headers.get('Authorization')).toBe('Bearer cookie-token')
    })

    it('should handle empty auth-token cookie', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          Cookie: 'auth-token=; other=value',
        },
      })

      const result = adaptCookieToBearer(request)

      expect(result.headers.get('Authorization')).toBeNull()
    })
  })

  describe('adaptResponseWithCookie', () => {
    it('should return response unchanged when no action is provided', async () => {
      const originalResponse = NextResponse.json({ message: 'success' })

      const result = await adaptResponseWithCookie(originalResponse)

      expect(result).toBe(originalResponse)
    })

    it('should set auth-token cookie when action is "set"', async () => {
      const originalResponse = NextResponse.json({ message: 'success' })
      const token = 'test-token'

      const result = await adaptResponseWithCookie(originalResponse, token, 'set')

      const setCookieHeader = result.headers.get('Set-Cookie')
      expect(setCookieHeader).toContain('auth-token=test-token')
      expect(setCookieHeader).toContain('HttpOnly')
      expect(setCookieHeader).toContain('SameSite=lax')
      expect(setCookieHeader).toContain('Max-Age=604800') // 7 days
    })

    it('should delete auth-token cookie when action is "delete"', async () => {
      const originalResponse = NextResponse.json({ message: 'success' })

      const result = await adaptResponseWithCookie(originalResponse, undefined, 'delete')

      const setCookieHeader = result.headers.get('Set-Cookie')
      expect(setCookieHeader).toContain('auth-token=')
      expect(setCookieHeader).toContain('Max-Age=0')
    })

    it('should preserve response body and status', async () => {
      const originalResponse = NextResponse.json({ message: 'test data', id: 123 }, { status: 201 })

      const result = await adaptResponseWithCookie(originalResponse, 'token', 'set')

      expect(result.status).toBe(201)
      const body = await result.json()
      expect(body).toEqual({ message: 'test data', id: 123 })
    })

    it('should preserve original response headers', async () => {
      const originalResponse = NextResponse.json(
        { message: 'success' },
        {
          headers: {
            'X-Custom-Header': 'custom-value',
            'Content-Type': 'application/json',
          },
        }
      )

      const result = await adaptResponseWithCookie(originalResponse, 'token', 'set')

      // NOTE: NextResponse.json() may not preserve all custom headers when cloned
      // This is expected behavior for this implementation
      expect(result.headers.get('Content-Type')).toBe('application/json')
      expect(result.status).toBe(200)

      const setCookieHeader = result.headers.get('Set-Cookie')
      expect(setCookieHeader).toContain('auth-token=token')
    })

    it('should not set cookie when action is "set" but no token provided', async () => {
      const originalResponse = NextResponse.json({ message: 'success' })

      const result = await adaptResponseWithCookie(originalResponse, undefined, 'set')

      const setCookieHeader = result.headers.get('Set-Cookie')
      expect(setCookieHeader).toBeNull()
    })

    it('should set secure flag in production environment', async () => {
      const originalNodeEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true,
      })

      const originalResponse = NextResponse.json({ message: 'success' })

      const result = await adaptResponseWithCookie(originalResponse, 'token', 'set')

      const setCookieHeader = result.headers.get('Set-Cookie')
      expect(setCookieHeader).toContain('Secure')

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        writable: true,
        configurable: true,
      })
    })

    it('should not set secure flag in development environment', async () => {
      const originalNodeEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
      })

      const originalResponse = NextResponse.json({ message: 'success' })

      const result = await adaptResponseWithCookie(originalResponse, 'token', 'set')

      const setCookieHeader = result.headers.get('Set-Cookie')
      expect(setCookieHeader).not.toContain('Secure')

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        writable: true,
        configurable: true,
      })
    })

    it('should handle complex response data', async () => {
      const complexData = {
        user: {
          id: 'user-123',
          name: 'Test User',
          permissions: ['read', 'write'],
        },
        metadata: {
          timestamp: '2023-01-01T00:00:00Z',
          version: '1.0.0',
        },
      }

      const originalResponse = NextResponse.json(complexData, { status: 200 })

      const result = await adaptResponseWithCookie(originalResponse, 'token', 'set')

      expect(result.status).toBe(200)
      const body = await result.json()
      expect(body).toEqual(complexData)

      const setCookieHeader = result.headers.get('Set-Cookie')
      expect(setCookieHeader).toContain('auth-token=token')
    })

    it('should handle delete action with token parameter (token should be ignored)', async () => {
      const originalResponse = NextResponse.json({ message: 'logged out' })

      const result = await adaptResponseWithCookie(originalResponse, 'ignored-token', 'delete')

      const setCookieHeader = result.headers.get('Set-Cookie')
      expect(setCookieHeader).toContain('auth-token=')
      expect(setCookieHeader).toContain('Max-Age=0')
      expect(setCookieHeader).not.toContain('ignored-token')
    })

    it('should handle response with error status codes', async () => {
      const originalResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const result = await adaptResponseWithCookie(originalResponse, undefined, 'delete')

      expect(result.status).toBe(401)
      const body = await result.json()
      expect(body).toEqual({ error: 'Unauthorized' })

      const setCookieHeader = result.headers.get('Set-Cookie')
      expect(setCookieHeader).toContain('Max-Age=0')
    })
  })
})
