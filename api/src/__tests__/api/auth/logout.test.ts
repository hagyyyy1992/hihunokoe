import { POST } from '@/app/api/auth/logout/route'
import { NextRequest } from 'next/server'

describe('/api/auth/logout', () => {
  describe('POST', () => {
    it('認証トークンが提供されない場合、401エラーを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('No authentication token provided')
    })

    it('有効なトークンでログアウト成功レスポンスを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})
