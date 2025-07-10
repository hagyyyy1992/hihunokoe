import { NextRequest } from 'next/server'
import { PostController } from '@api/framework/controllers/PostController'

// モック設定
const mockGetEmpathyStatus = jest.fn()
const mockAddEmpathy = jest.fn()
const mockRemoveEmpathy = jest.fn()

jest.mock('@api/framework/controllers/PostController', () => {
  return {
    PostController: jest.fn().mockImplementation(() => {
      return {
        getEmpathyStatus: mockGetEmpathyStatus,
        addEmpathy: mockAddEmpathy,
        removeEmpathy: mockRemoveEmpathy,
      }
    }),
  }
})

describe('/api/posts/[id]/empathy', () => {
  let GET: typeof import('@/app/api/posts/[id]/empathy/route').GET
  let POST: typeof import('@/app/api/posts/[id]/empathy/route').POST
  let DELETE: typeof import('@/app/api/posts/[id]/empathy/route').DELETE

  beforeAll(async () => {
    // モック設定後にモジュールをインポート
    const module = await import('@/app/api/posts/[id]/empathy/route')
    GET = module.GET
    POST = module.POST
    DELETE = module.DELETE
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createContext = (id: string) => ({
    params: Promise.resolve({ id }),
  })

  describe('GET', () => {
    it('共感状態を取得できる', async () => {
      const mockResponse = new Response(
        JSON.stringify({
          hasEmpathized: true,
          empathyType: 'helpful',
          totalCount: 5,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )

      mockGetEmpathyStatus.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/posts/post-id/empathy', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      })

      const context = createContext('post-id')
      const response = await GET(request, context)
      const data = await response.json()

      expect(mockGetEmpathyStatus).toHaveBeenCalledWith(request, {
        params: { id: 'post-id' },
      })
      expect(response.status).toBe(200)
      expect(data.hasEmpathized).toBe(true)
      expect(data.empathyType).toBe('helpful')
      expect(data.totalCount).toBe(5)
    })

    it('認証されていない場合は401を返す', async () => {
      const mockResponse = new Response(JSON.stringify({ error: 'ログインが必要です' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })

      mockGetEmpathyStatus.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/posts/post-id/empathy')

      const context = createContext('post-id')
      const response = await GET(request, context)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('ログインが必要です')
    })

    it('投稿が見つからない場合は404を返す', async () => {
      const mockResponse = new Response(JSON.stringify({ error: '投稿が見つかりません' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })

      mockGetEmpathyStatus.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/posts/nonexistent/empathy', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      })

      const context = createContext('nonexistent')
      const response = await GET(request, context)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })
  })

  describe('POST', () => {
    it('共感を追加できる', async () => {
      const mockResponse = new Response(
        JSON.stringify({
          success: true,
          empathy: {
            id: 'empathy-id',
            postId: 'post-id',
            userId: 'user-id',
            empathyType: 'helpful',
          },
          totalCount: 6,
          message: '共感を追加しました',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )

      mockAddEmpathy.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/posts/post-id/empathy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({ empathyType: 'helpful' }),
      })

      const context = createContext('post-id')
      const response = await POST(request, context)
      const data = await response.json()

      expect(mockAddEmpathy).toHaveBeenCalledWith(request, {
        params: { id: 'post-id' },
      })
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.empathy.empathyType).toBe('helpful')
      expect(data.totalCount).toBe(6)
    })

    it('既に共感済みの場合は400を返す', async () => {
      const mockResponse = new Response(JSON.stringify({ error: '既に共感済みです' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })

      mockAddEmpathy.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/posts/post-id/empathy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({ empathyType: 'helpful' }),
      })

      const context = createContext('post-id')
      const response = await POST(request, context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('既に共感済みです')
    })

    it('無効なempathyTypeの場合は400を返す', async () => {
      const mockResponse = new Response(JSON.stringify({ error: '入力内容に誤りがあります' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })

      mockAddEmpathy.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/posts/post-id/empathy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({ empathyType: 'invalid' }),
      })

      const context = createContext('post-id')
      const response = await POST(request, context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('入力内容に誤りがあります')
    })
  })

  describe('DELETE', () => {
    it('共感を削除できる', async () => {
      const mockResponse = new Response(
        JSON.stringify({
          success: true,
          empathyCount: 4,
          message: '共感を削除しました',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )

      mockRemoveEmpathy.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/posts/post-id/empathy', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer valid-token',
        },
      })

      const context = createContext('post-id')
      const response = await DELETE(request, context)
      const data = await response.json()

      expect(mockRemoveEmpathy).toHaveBeenCalledWith(request, {
        params: { id: 'post-id' },
      })
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.empathyCount).toBe(4)
    })

    it('共感が存在しない場合は404を返す', async () => {
      const mockResponse = new Response(JSON.stringify({ error: '共感が見つかりません' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })

      mockRemoveEmpathy.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/posts/post-id/empathy', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer valid-token',
        },
      })

      const context = createContext('post-id')
      const response = await DELETE(request, context)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('共感が見つかりません')
    })

    it('認証されていない場合は401を返す', async () => {
      const mockResponse = new Response(JSON.stringify({ error: 'ログインが必要です' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })

      mockRemoveEmpathy.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/posts/post-id/empathy', {
        method: 'DELETE',
      })

      const context = createContext('post-id')
      const response = await DELETE(request, context)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('ログインが必要です')
    })
  })

  it('サーバーエラーの場合は500を返す', async () => {
    mockGetEmpathyStatus.mockRejectedValue(new Error('Database connection error'))

    const request = new NextRequest('http://localhost:3000/api/posts/post-id/empathy', {
      headers: {
        Authorization: 'Bearer valid-token',
      },
    })

    const context = createContext('post-id')
    await expect(GET(request, context)).rejects.toThrow('Database connection error')
  })
})
