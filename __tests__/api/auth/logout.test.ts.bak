import { POST } from '@/app/api/auth/logout/route'

describe('/api/auth/logout', () => {
  describe('POST', () => {
    it('ログアウト成功レスポンスを返す', async () => {
      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('ログアウトしました')
    })

    it('auth-tokenクッキーを削除する', async () => {
      const response = await POST()

      // Check if the cookie is set to expire immediately
      const cookies = response.headers.get('set-cookie')
      expect(cookies).toContain('auth-token=')
      expect(cookies).toContain('Max-Age=0')
      expect(cookies).toContain('HttpOnly')
      expect(cookies).toContain('SameSite=lax')
    })

    it('本番環境でSecureクッキーが設定される', async () => {
      const originalEnv = process.env.NODE_ENV
      const mockEnv = { ...process.env, NODE_ENV: 'production' as const }
      jest.replaceProperty(process, 'env', mockEnv as NodeJS.ProcessEnv)

      const response = await POST()

      const cookies = response.headers.get('set-cookie')
      expect(cookies).toContain('Secure')

      jest.replaceProperty(process, 'env', {
        ...process.env,
        NODE_ENV: originalEnv as 'development' | 'production' | 'test',
      } as NodeJS.ProcessEnv)
    })

    it('開発環境でSecureクッキーが設定されない', async () => {
      const originalEnv = process.env.NODE_ENV
      const mockEnv = { ...process.env, NODE_ENV: 'development' as const }
      jest.replaceProperty(process, 'env', mockEnv as NodeJS.ProcessEnv)

      const response = await POST()

      const cookies = response.headers.get('set-cookie')
      expect(cookies).not.toContain('Secure')

      jest.replaceProperty(process, 'env', {
        ...process.env,
        NODE_ENV: originalEnv as 'development' | 'production' | 'test',
      } as NodeJS.ProcessEnv)
    })
  })
})
