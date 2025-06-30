// Mock the modules first
jest.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    empathy: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
  isDatabaseAvailable: jest.fn(),
}))

jest.mock('@/lib/mock-data', () => {
  // テスト用のモックデータ配列を定義
  const mockPosts: any[] = []
  const mockEmpathies: any[] = []

  return {
    MOCK_POSTS: mockPosts,
    MOCK_EMPATHIES: mockEmpathies,
  }
})

import { NextRequest } from 'next/server'
import { GET, POST, DELETE } from '../../../src/app/api/posts/empathy/route'
import * as prismaModule from '@/lib/prisma'
import { MOCK_POSTS, MOCK_EMPATHIES } from '@/lib/mock-data'
import { verifyToken } from '@/lib/auth/auth'

const mockIsDatabaseAvailable = prismaModule.isDatabaseAvailable as jest.MockedFunction<
  typeof prismaModule.isDatabaseAvailable
>
const mockPrisma = prismaModule.prisma as any

// Auth mocking
jest.mock('@/lib/auth/auth', () => ({
  verifyToken: jest.fn(),
}))

const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>

// AuthUser型に合わせたモックユーザー
const mockUser1 = {
  id: '550e8400-e29b-41d4-a716-446655440011',
  userName: 'testuser1',
  email: 'user1@example.com',
}
const mockUser2 = {
  id: '550e8400-e29b-41d4-a716-446655440012',
  userName: 'testuser2',
  email: 'user2@example.com',
}

describe('/api/posts/empathy (query parameter)', () => {
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
      user: { id: '550e8400-e29b-41d4-a716-446655440011', userName: 'testuser1' },
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

  const createRequest = (postId: string, method = 'GET', body?: any, token?: string) => {
    const url = `http://localhost:3000/api/posts/empathy?id=${postId}`
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

  describe('GET', () => {
    it('認証されていない場合、401エラーを返す', async () => {
      const request = createRequest('550e8400-e29b-41d4-a716-446655440001')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('ログインが必要です')
    })

    it('ユーザーの共感状態を取得できる（モックモード）', async () => {
      mockVerifyToken.mockReturnValue(mockUser2)

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440001',
        'GET',
        null,
        'valid-token'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.hasEmpathized).toBe(true)
      expect(data.empathyType).toBe('helpful')
      expect(data.totalCount).toBe(1)
    })

    it('投稿が存在しない場合、404エラーを返す', async () => {
      mockVerifyToken.mockReturnValue(mockUser1)

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440099',
        'GET',
        null,
        'valid-token'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('無効なIDの場合、400エラーを返す', async () => {
      mockVerifyToken.mockReturnValue(mockUser1)

      const request = createRequest('invalid-id', 'GET', null, 'valid-token')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('無効なIDです')
    })

    it('IDが指定されていない場合、400エラーを返す', async () => {
      const url = 'http://localhost:3000/api/posts/empathy' // idパラメータなし
      const req = new NextRequest(url, { method: 'GET' })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('IDが指定されていません')
    })
  })

  describe('POST', () => {
    beforeEach(() => {
      mockVerifyToken.mockReset()
    })

    it('共感を追加できる（モックモード）', async () => {
      mockVerifyToken.mockReturnValue(mockUser1)

      const empathyData = {
        empathyType: 'interested',
      }

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440001',
        'POST',
        empathyData,
        'valid-token'
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.empathy.empathyType).toBe('interested')
      expect(data.empathy.postId).toBe('550e8400-e29b-41d4-a716-446655440001')
      expect(data.empathy.userId).toBe(mockUser1.id)
      expect(data.totalCount).toBe(2) // 既存の1個 + 新規追加の1個
      expect(data.message).toBe('共感を追加しました（デモモード）')
    })

    it('既に共感済みの場合、400エラーを返す（モックモード）', async () => {
      mockVerifyToken.mockReturnValue(mockUser2) // 既に共感済みのユーザー

      const empathyData = {
        empathyType: 'helpful',
      }

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440001',
        'POST',
        empathyData,
        'valid-token'
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('既に共感済みです')
    })

    it('認証されていない場合、401エラーを返す', async () => {
      const empathyData = {
        empathyType: 'helpful',
      }

      const request = createRequest('550e8400-e29b-41d4-a716-446655440001', 'POST', empathyData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('ログインが必要です')
    })

    it('無効なempathyTypeの場合、400エラーを返す', async () => {
      mockVerifyToken.mockReturnValue(mockUser1)

      const empathyData = {
        empathyType: 'invalid_type',
      }

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440001',
        'POST',
        empathyData,
        'valid-token'
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('入力内容に誤りがあります')
    })

    it('データベースモードで共感を追加できる', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockVerifyToken.mockReturnValue(mockUser1)

      const mockPost = { id: '550e8400-e29b-41d4-a716-446655440001' }
      const mockEmpathy = {
        id: 'empathy-new',
        postId: '550e8400-e29b-41d4-a716-446655440001',
        userId: mockUser1.id,
        empathyType: 'helpful',
      }

      mockPrisma.post.findUnique.mockResolvedValue(mockPost)
      mockPrisma.empathy.findUnique.mockResolvedValue(null) // 既存の共感なし
      mockPrisma.$transaction.mockResolvedValue({ empathy: mockEmpathy, totalCount: 2 })

      const empathyData = {
        empathyType: 'helpful',
      }

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440001',
        'POST',
        empathyData,
        'valid-token'
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('共感を追加しました')
    })
  })

  describe('DELETE', () => {
    beforeEach(() => {
      mockVerifyToken.mockReset()
    })

    it('共感を削除できる（モックモード）', async () => {
      mockVerifyToken.mockReturnValue(mockUser2) // 共感済みのユーザー

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440001',
        'DELETE',
        null,
        'valid-token'
      )

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.totalCount).toBe(0) // 削除後の総数
      expect(data.message).toBe('共感を削除しました（デモモード）')
    })

    it('共感が存在しない場合、404エラーを返す（モックモード）', async () => {
      mockVerifyToken.mockReturnValue(mockUser1) // 共感していないユーザー

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440001',
        'DELETE',
        null,
        'valid-token'
      )

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('共感が見つかりません')
    })

    it('認証されていない場合、401エラーを返す', async () => {
      const request = createRequest('550e8400-e29b-41d4-a716-446655440001', 'DELETE')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('ログインが必要です')
    })

    it('データベースモードで共感を削除できる', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockVerifyToken.mockReturnValue(mockUser1)

      const mockPost = { id: '550e8400-e29b-41d4-a716-446655440001' }
      const mockEmpathy = {
        id: 'empathy-1',
        postId: '550e8400-e29b-41d4-a716-446655440001',
        userId: mockUser1.id,
        empathyType: 'helpful',
      }

      mockPrisma.post.findUnique.mockResolvedValue(mockPost)
      mockPrisma.empathy.findUnique.mockResolvedValue(mockEmpathy)
      mockPrisma.$transaction.mockResolvedValue(1) // 削除後の総数

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440001',
        'DELETE',
        null,
        'valid-token'
      )

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.totalCount).toBe(1)
      expect(data.message).toBe('共感を削除しました')
    })
  })
})
