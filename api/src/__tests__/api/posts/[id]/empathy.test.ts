jest.mock('@api/framework/controllers/PostController', () => ({
  PostController: jest.fn().mockImplementation(() => ({
    toggleEmpathy: jest.fn().mockImplementation(async request => {
      // Default mock implementation
      return new Response(JSON.stringify({ message: 'Mock response' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }),
  })),
}))

import { NextRequest } from 'next/server'
import { POST, DELETE } from '@/app/api/posts/[id]/empathy/route'

// Mock the controller

const createMockResponse = (status, data) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
  })
}

describe('/api/posts/[id]/empathy', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default to mock mode
    mockIsDatabaseAvailable.mockReturnValue(false)

    // Reset mock data arrays to initial state
    MOCK_POSTS.length = 0
    MOCK_POSTS.push({
      id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Test Post 1',
      content: 'Test content 1',
      cosmeticName: 'Test Cosmetic 1',
      cosmeticCategory: 'toner',
      skinType: 'normal',
      moodTag: 'good',
      status: 'published',
      viewCount: 10,
      empathyCount: 1,
      userId: '550e8400-e29b-41d4-a716-446655440011',
      user: { id: '550e8400-e29b-41d4-a716-446655440011', username: 'testuser1' },
    } as any)

    MOCK_EMPATHIES.length = 0
    MOCK_EMPATHIES.push({
      id: 'empathy-1',
      postId: '550e8400-e29b-41d4-a716-446655440001',
      userId: '550e8400-e29b-41d4-a716-446655440012',
      empathyType: 'helpful',
      createdAt: new Date('2024-01-16'),
    } as any)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const createRequest = (method = 'GET', body?: any, token?: string) => {
    const url = `http://localhost:3000/api/posts/550e8400-e29b-41d4-a716-446655440001/empathy`
    const headers: HeadersInit = {}
    const cookies: { name: string; value: string }[] = []

    if (token) {
      cookies.push({ name: 'auth-token', value: token })
    }

    const req = new NextRequest(url, {
      method,
      headers,
      ...(body && { body: JSON.stringify(body) }),
    })

    // Cookieをモック
    if (token) {
      Object.defineProperty(req, 'cookies', {
        get: () => ({
          get: (name: string) => {
            const cookie = cookies.find(c => c.name === name)
            return cookie ? { name: cookie.name, value: cookie.value } : undefined
          },
        }),
      })
    }

    return req
  }

  const createParams = (id: string) => Promise.resolve({ id })

  describe('GET', () => {
    it('無効なUUIDの場合、400エラーを返す', async () => {
      const request = createRequest('GET', null, 'valid-token')
      const params = createParams('invalid-id')

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('無効なIDです')
    })

    it('認証されていない場合、401エラーを返す', async () => {
      const request = createRequest('GET')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('ログインが必要です')
    })

    it('無効なトークンの場合、401エラーを返す', async () => {
      mockToggleEmpathy.mockReturnValue(null)
      const request = createRequest('GET', null, 'invalid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('トークンが無効です')
    })

    it('無効なユーザーUUIDの場合、400エラーを返す', async () => {
      mockToggleEmpathy.mockReturnValue(mockUserInvalidId)
      const request = createRequest('GET', null, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('ユーザーIDが無効です')
    })

    it('モックモードで投稿が見つからない場合、404エラーを返す', async () => {
      mockToggleEmpathy.mockReturnValue(mockUser1)
      const request = createRequest('GET', null, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440099')

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('モックモードでユーザーが共感済みの場合、共感状態を返す', async () => {
      mockToggleEmpathy.mockReturnValue(mockUser2)
      const request = createRequest('GET', null, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.hasEmpathized).toBe(true)
      expect(data.empathyType).toBe('helpful')
      expect(data.totalCount).toBe(1)
    })

    it('モックモードでユーザーが未共感の場合、共感状態を返す', async () => {
      mockToggleEmpathy.mockReturnValue(mockUser1)
      const request = createRequest('GET', null, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.hasEmpathized).toBe(false)
      expect(data.empathyType).toBeUndefined()
      expect(data.totalCount).toBe(1)
    })

    it('データベースモードで投稿が見つからない場合、404エラーを返す', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockToggleEmpathy.mockReturnValue(mockUser1)
      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, null))

      const request = createRequest('GET', null, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('投稿検索でデータベースエラーが発生した場合を処理する', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockToggleEmpathy.mockReturnValue(mockUser1)
      mockPrisma.post.findUnique.mockResolvedValue(
        createMockResponse(500, { error: 'Database error' })
      )

      const request = createRequest('GET', null, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('データベースモードでユーザーが共感済みの場合、共感状態を返す', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockToggleEmpathy.mockReturnValue(mockUser1)

      const mockPost = { id: '550e8400-e29b-41d4-a716-446655440001' }
      const mockEmpathy = {
        id: 'empathy-1',
        postId: '550e8400-e29b-41d4-a716-446655440001',
        userId: mockUser1.id,
        empathyType: 'helpful',
      }

      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, mockPost))
      mockPrisma.empathy.findUnique.mockResolvedValue(createMockResponse(200, mockEmpathy))
      mockPrisma.empathy.count.mockResolvedValue(createMockResponse(200, 5))

      const request = createRequest('GET', null, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.hasEmpathized).toBe(true)
      expect(data.empathyType).toBe('helpful')
      expect(data.totalCount).toBe(5)
    })

    it('データベースモードでユーザーが未共感の場合、共感状態を返す', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockToggleEmpathy.mockReturnValue(mockUser1)

      const mockPost = { id: '550e8400-e29b-41d4-a716-446655440001' }

      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, mockPost))
      mockPrisma.empathy.findUnique.mockResolvedValue(createMockResponse(200, null))
      mockPrisma.empathy.count.mockResolvedValue(createMockResponse(200, 3))

      const request = createRequest('GET', null, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.hasEmpathized).toBe(false)
      expect(data.empathyType).toBeUndefined()
      expect(data.totalCount).toBe(3)
    })

    it('共感操作でデータベースエラーが発生した場合を処理する', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockToggleEmpathy.mockReturnValue(mockUser1)

      const mockPost = { id: '550e8400-e29b-41d4-a716-446655440001' }

      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, mockPost))
      mockPrisma.empathy.findUnique.mockResolvedValue(
        createMockResponse(500, { error: 'Database error' })
      )

      const request = createRequest('GET', null, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('共感状態の取得に失敗しました')
    })

    it('GET処理で一般的なエラーが発生した場合を処理する', async () => {
      mockToggleEmpathy.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const request = createRequest('GET', null, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('共感状態の取得に失敗しました')
    })
  })

  describe('POST', () => {
    beforeEach(() => {
      mockToggleEmpathy.mockReset()
      mockToggleEmpathy.mockReturnValue(mockUser1) // Default authentication
    })

    it('無効なUUIDの場合、400エラーを返す', async () => {
      const request = createRequest('POST', { empathyType: 'helpful' }, 'valid-token')
      const params = createParams('invalid-id')

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('無効なIDです')
    })

    it('認証されていない場合、401エラーを返す', async () => {
      // Override default authentication for this test
      mockToggleEmpathy.mockReturnValue(null)
      const request = createRequest('POST', { empathyType: 'helpful' })
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('ログインが必要です')
    })

    it('無効なトークンの場合、401エラーを返す', async () => {
      mockToggleEmpathy.mockReturnValue(null)
      const request = createRequest('POST', { empathyType: 'helpful' }, 'invalid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('トークンが無効です')
    })

    it('無効なユーザーUUIDの場合、400エラーを返す', async () => {
      mockToggleEmpathy.mockReturnValue(mockUserInvalidId)
      const request = createRequest('POST', { empathyType: 'helpful' }, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('ユーザーIDが無効です')
    })

    it('無効なJSONボディの場合、400エラーを返す', async () => {
      mockToggleEmpathy.mockReturnValue(mockUser1)

      // Create request with invalid JSON
      const url = `http://localhost:3000/api/posts/550e8400-e29b-41d4-a716-446655440001/empathy`
      const req = new NextRequest(url, {
        method: 'POST',
        body: 'invalid-json',
      })

      Object.defineProperty(req, 'cookies', {
        get: () => ({
          get: () => ({ name: 'auth-token', value: 'valid-token' }),
        }),
      })

      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await POST(req, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('リクエストボディが無効です')
    })

    it('無効な共感タイプの場合、400エラーを返す', async () => {
      mockToggleEmpathy.mockReturnValue(mockUser1)
      const request = createRequest('POST', { empathyType: 'invalid_type' }, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('入力内容に誤りがあります')
    })

    it('共感タイプが未指定の場合、デフォルト値を使用する', async () => {
      mockToggleEmpathy.mockReturnValue(mockUser1)
      const request = createRequest('POST', {}, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.empathy.empathyType).toBe('helpful') // default value
    })

    it('モックモードで投稿が見つからない場合、404エラーを返す', async () => {
      mockToggleEmpathy.mockReturnValue(mockUser1)
      const request = createRequest('POST', { empathyType: 'helpful' }, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440099')

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('モックモードで既に共感済みの場合、400エラーを返す', async () => {
      mockToggleEmpathy.mockReturnValue(mockUser2) // User who already empathized
      const request = createRequest('POST', { empathyType: 'helpful' }, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('既に共感済みです')
    })

    it('モックモードで共感を正常に追加できる', async () => {
      mockToggleEmpathy.mockReturnValue(mockUser1)
      const request = createRequest('POST', { empathyType: 'interested' }, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const initialEmpathyCount = MOCK_EMPATHIES.length
      const initialPostEmpathyCount = MOCK_POSTS[0].empathyCount

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.empathy.empathyType).toBe('interested')
      expect(data.empathy.postId).toBe('550e8400-e29b-41d4-a716-446655440001')
      expect(data.empathy.userId).toBe(mockUser1.id)
      expect(data.totalCount).toBe(initialEmpathyCount + 1)
      expect(data.message).toBe('共感を追加しました（デモモード）')
      expect(MOCK_POSTS[0].empathyCount).toBe(initialPostEmpathyCount + 1)
    })

    it('モックモードでエラーが発生した場合を処理する', async () => {
      mockToggleEmpathy.mockReturnValue(mockUser1)

      // Mock findIndex to throw error to trigger mock error handling
      const originalFindIndex = Array.prototype.findIndex
      Array.prototype.findIndex = jest.fn().mockImplementation(() => {
        throw new Error('Mock error')
      })

      const request = createRequest('POST', { empathyType: 'helpful' }, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('モックモードでエラーが発生しました')

      // Restore original method
      Array.prototype.findIndex = originalFindIndex
    })

    it('データベースモードで投稿が見つからない場合、404エラーを返す', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockToggleEmpathy.mockReturnValue(mockUser1)
      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, null))

      const request = createRequest('POST', { empathyType: 'helpful' }, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('POSTの投稿検索でデータベースエラーが発生した場合を処理する', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockToggleEmpathy.mockReturnValue(mockUser1)
      mockPrisma.post.findUnique.mockResolvedValue(
        createMockResponse(500, { error: 'Database error' })
      )

      const request = createRequest('POST', { empathyType: 'helpful' }, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('データベースモードで既に共感済みの場合、400エラーを返す', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockToggleEmpathy.mockReturnValue(mockUser1)

      const mockPost = { id: '550e8400-e29b-41d4-a716-446655440001' }
      const mockEmpathy = {
        id: 'empathy-1',
        postId: '550e8400-e29b-41d4-a716-446655440001',
        userId: mockUser1.id,
        empathyType: 'helpful',
      }

      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, mockPost))
      mockPrisma.empathy.findUnique.mockResolvedValue(createMockResponse(200, mockEmpathy))

      const request = createRequest('POST', { empathyType: 'helpful' }, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('既に共感済みです')
    })

    it('既存共感チェックでデータベースエラーが発生した場合を処理する', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockToggleEmpathy.mockReturnValue(mockUser1)

      const mockPost = { id: '550e8400-e29b-41d4-a716-446655440001' }

      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, mockPost))
      mockPrisma.empathy.findUnique.mockResolvedValue(
        createMockResponse(500, { error: 'Database error' })
      )

      const request = createRequest('POST', { empathyType: 'helpful' }, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('共感の追加に失敗しました')
    })

    it('データベースモードで共感を正常に追加できる', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockToggleEmpathy.mockReturnValue(mockUser1)

      const mockPost = { id: '550e8400-e29b-41d4-a716-446655440001' }
      const mockEmpathy = {
        id: 'empathy-new',
        postId: '550e8400-e29b-41d4-a716-446655440001',
        userId: mockUser1.id,
        empathyType: 'helpful',
      }

      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, mockPost))
      mockPrisma.empathy.findUnique.mockResolvedValue(createMockResponse(200, null))

      // Mock transaction to call the actual function
      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        const mockTx = {
          empathy: {
            create: jest.fn().mockResolvedValue(createMockResponse(200, mockEmpathy)),
            count: jest.fn().mockResolvedValue(createMockResponse(200, 3)),
          },
          post: {
            update: jest.fn().mockResolvedValue(createMockResponse(200, {})),
          },
        }
        return await fn(mockTx)
      })

      const request = createRequest('POST', { empathyType: 'helpful' }, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.empathy).toEqual(mockEmpathy)
      expect(data.totalCount).toBe(3)
      expect(data.message).toBe('共感を追加しました')
    })

    it('データベーストランザクションエラーが発生した場合を処理する', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockToggleEmpathy.mockReturnValue(mockUser1)

      const mockPost = { id: '550e8400-e29b-41d4-a716-446655440001' }

      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, mockPost))
      mockPrisma.empathy.findUnique.mockResolvedValue(createMockResponse(200, null))
      mockPrisma.$transaction.mockResolvedValue(
        createMockResponse(500, { error: 'Transaction failed' })
      )

      const request = createRequest('POST', { empathyType: 'helpful' }, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('共感の追加に失敗しました')
    })

    it('POST処理で一般的なエラーが発生した場合を処理する', async () => {
      mockToggleEmpathy.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const request = createRequest('POST', { empathyType: 'helpful' }, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('共感の追加に失敗しました')
    })
  })

  describe('DELETE', () => {
    beforeEach(() => {
      mockToggleEmpathy.mockReset()
      mockToggleEmpathy.mockReturnValue(mockUser1) // Default authentication
    })

    it('無効なUUIDの場合、400エラーを返す', async () => {
      const request = createRequest('DELETE', null, 'valid-token')
      const params = createParams('invalid-id')

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('無効なIDです')
    })

    it('認証されていない場合、401エラーを返す', async () => {
      // Override default authentication for this test
      mockToggleEmpathy.mockReturnValue(null)
      const request = createRequest('DELETE')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('ログインが必要です')
    })

    it('無効なトークンの場合、401エラーを返す', async () => {
      mockToggleEmpathy.mockReturnValue(null)
      const request = createRequest('DELETE', null, 'invalid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('トークンが無効です')
    })

    it('無効なユーザーUUIDの場合、400エラーを返す', async () => {
      mockToggleEmpathy.mockReturnValue(mockUserInvalidId)
      const request = createRequest('DELETE', null, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('ユーザーIDが無効です')
    })

    it('モックモードで投稿が見つからない場合、404エラーを返す', async () => {
      mockToggleEmpathy.mockReturnValue(mockUser1)
      const request = createRequest('DELETE', null, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440099')

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('モックモードで共感が見つからない場合、404エラーを返す', async () => {
      mockToggleEmpathy.mockReturnValue(mockUser1) // User who has not empathized
      const request = createRequest('DELETE', null, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('共感が見つかりません')
    })

    it('モックモードで共感を正常に削除できる', async () => {
      mockToggleEmpathy.mockReturnValue(mockUser2) // User who has empathized
      const request = createRequest('DELETE', null, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const initialEmpathyCount = MOCK_EMPATHIES.length
      const initialPostEmpathyCount = MOCK_POSTS[0].empathyCount

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.totalCount).toBe(initialEmpathyCount - 1)
      expect(data.message).toBe('共感を削除しました（デモモード）')
      expect(MOCK_POSTS[0].empathyCount).toBe(initialPostEmpathyCount - 1)
    })

    it('モックモードで共感数が負の値にならないよう制御する', async () => {
      // Set empathy count to 0 to test Math.max protection
      MOCK_POSTS[0].empathyCount = 0
      mockToggleEmpathy.mockReturnValue(mockUser2)
      const request = createRequest('DELETE', null, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(MOCK_POSTS[0].empathyCount).toBe(0) // Should not go below 0
    })

    it('データベースモードで投稿が見つからない場合、404エラーを返す', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockToggleEmpathy.mockReturnValue(mockUser1)
      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, null))

      const request = createRequest('DELETE', null, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('DELETEの投稿検索でデータベースエラーが発生した場合を処理する', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockToggleEmpathy.mockReturnValue(mockUser1)
      mockPrisma.post.findUnique.mockResolvedValue(
        createMockResponse(500, { error: 'Database error' })
      )

      const request = createRequest('DELETE', null, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('データベースモードで共感が見つからない場合、404エラーを返す', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockToggleEmpathy.mockReturnValue(mockUser1)

      const mockPost = { id: '550e8400-e29b-41d4-a716-446655440001' }

      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, mockPost))
      mockPrisma.empathy.findUnique.mockResolvedValue(createMockResponse(200, null))

      const request = createRequest('DELETE', null, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('共感が見つかりません')
    })

    it('DELETEの共感検索でデータベースエラーが発生した場合を処理する', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockToggleEmpathy.mockReturnValue(mockUser1)

      const mockPost = { id: '550e8400-e29b-41d4-a716-446655440001' }

      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, mockPost))
      mockPrisma.empathy.findUnique.mockResolvedValue(
        createMockResponse(500, { error: 'Database error' })
      )

      const request = createRequest('DELETE', null, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('共感が見つかりません')
    })

    it('データベースモードで共感を正常に削除できる', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockToggleEmpathy.mockReturnValue(mockUser1)

      const mockPost = { id: '550e8400-e29b-41d4-a716-446655440001' }
      const mockEmpathy = {
        id: 'empathy-1',
        postId: '550e8400-e29b-41d4-a716-446655440001',
        userId: mockUser1.id,
        empathyType: 'helpful',
      }

      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, mockPost))
      mockPrisma.empathy.findUnique.mockResolvedValue(createMockResponse(200, mockEmpathy))

      // Mock transaction to call the actual function
      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        const mockTx = {
          empathy: {
            delete: jest.fn().mockResolvedValue(createMockResponse(200, {})),
            count: jest.fn().mockResolvedValue(createMockResponse(200, 2)),
          },
          post: {
            update: jest.fn().mockResolvedValue(createMockResponse(200, {})),
          },
        }
        return await fn(mockTx)
      })

      const request = createRequest('DELETE', null, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.totalCount).toBe(2)
      expect(data.message).toBe('共感を削除しました')
    })

    it('DELETE処理で一般的なエラーが発生した場合を処理する', async () => {
      mockToggleEmpathy.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const request = createRequest('DELETE', null, 'valid-token')
      const params = createParams('550e8400-e29b-41d4-a716-446655440001')

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('共感の削除に失敗しました')
    })
  })
})
