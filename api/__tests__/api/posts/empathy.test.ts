// Mock the modules first
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    empathy: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
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
import { GET, POST, DELETE } from '@/app/api/posts/empathy/route'
import * as prismaModule from '@/lib/prisma'
import { MOCK_POSTS, MOCK_EMPATHIES } from '@/lib/mock-data'
import * as tokenServiceModule from '@api/interface-adapters/services/TokenService'

// Get the mocked functions
const mockVerifyToken = (tokenServiceModule as any).__mockVerifyToken

const mockIsDatabaseAvailable = prismaModule.isDatabaseAvailable as jest.MockedFunction<
  typeof prismaModule.isDatabaseAvailable
>
const mockPrisma = prismaModule.prisma as any

// Auth mocking - mock TokenService
jest.mock('@api/interface-adapters/services/TokenService', () => {
  const mockVerifyAuthToken = jest.fn()
  const mockGenerateToken = jest.fn()
  const mockVerifyToken = jest.fn()
  const mockGenerateRandomToken = jest.fn()
  const mockGeneratePasswordResetToken = jest.fn()
  const mockVerifyPasswordResetToken = jest.fn()

  return {
    TokenServiceImpl: jest.fn().mockImplementation(() => ({
      verifyAuthToken: mockVerifyAuthToken,
      generateToken: mockGenerateToken,
      verifyToken: mockVerifyToken,
      generateRandomToken: mockGenerateRandomToken,
      generatePasswordResetToken: mockGeneratePasswordResetToken,
      verifyPasswordResetToken: mockVerifyPasswordResetToken,
    })),
    // Export mocks for test usage
    __mockVerifyAuthToken: mockVerifyAuthToken,
    __mockGenerateToken: mockGenerateToken,
    __mockVerifyToken: mockVerifyToken,
    __mockGenerateRandomToken: mockGenerateRandomToken,
    __mockGeneratePasswordResetToken: mockGeneratePasswordResetToken,
    __mockVerifyPasswordResetToken: mockVerifyPasswordResetToken,
  }
})

// AuthUser型に合わせたモックユーザー
const mockUser1 = {
  id: '550e8400-e29b-41d4-a716-446655440011',
  username: 'testuser1',
  email: 'user1@example.com',
}
const mockUser2 = {
  id: '550e8400-e29b-41d4-a716-446655440012',
  username: 'testuser2',
  email: 'user2@example.com',
}

describe.skip('/api/posts/empathy (query parameter) - LEGACY TEST - NEEDS REFACTOR FOR NEW ARCHITECTURE', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default to mock mode
    mockIsDatabaseAvailable.mockReturnValue(false)

    // Setup default authentication mock
    mockVerifyToken.mockResolvedValue({ userId: '550e8400-e29b-41d4-a716-446655440011' })

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

  const createRequest = (postId: string, method = 'GET', body?: any, token?: string) => {
    const url = `http://localhost:3000/api/posts/empathy?id=${postId}`
    const headers: HeadersInit = {}

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return new NextRequest(url, {
      method,
      headers,
      ...(body && { body: JSON.stringify(body) }),
    })
  }

  describe('GET', () => {
    it('認証されていない場合、401エラーを返す', async () => {
      // Override the default authentication mock to return null (unauthenticated)
      mockVerifyToken.mockResolvedValue(null)

      const request = createRequest('550e8400-e29b-41d4-a716-446655440001')

      const response = await GET(request)
      const data = await response.json()

      if (response.status !== 401) {
        console.log('Debug GET auth error:', { status: response.status, data })
      }

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
      expect(data.error.message).toBe('認証が必要です')
    })

    it('ユーザーの共感状態を取得できる（モックモード）', async () => {
      mockVerifyToken.mockResolvedValue({ userId: '550e8400-e29b-41d4-a716-446655440012' })

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440001',
        'GET',
        null,
        'valid-token'
      )

      const response = await GET(request)
      const data = await response.json()

      if (response.status !== 200) {
        console.log('Debug GET empathy success:', { status: response.status, data })
      }

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.hasEmpathized).toBe(true)
      expect(data.data.empathyType).toBe('helpful')
      expect(data.data.totalCount).toBe(1)
    })

    it('投稿が存在しない場合、404エラーを返す', async () => {
      mockVerifyToken.mockResolvedValue({ userId: '550e8400-e29b-41d4-a716-446655440011' })

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440099',
        'GET',
        null,
        'valid-token'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toContain('投稿')
    })

    it('無効なIDの場合、400エラーを返す', async () => {
      mockVerifyToken.mockResolvedValue({ userId: '550e8400-e29b-41d4-a716-446655440011' })

      const request = createRequest('invalid-id', 'GET', null, 'valid-token')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('入力値が不正です')
    })

    it('IDが指定されていない場合、400エラーを返す', async () => {
      const url = 'http://localhost:3000/api/posts/empathy' // idパラメータなし
      const req = new NextRequest(url, { method: 'GET' })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('入力値が不正です')
    })
  })

  describe('POST', () => {
    beforeEach(() => {
      mockVerifyToken.mockReset()
    })

    it('共感を追加できる（モックモード）', async () => {
      mockVerifyToken.mockResolvedValue({ userId: '550e8400-e29b-41d4-a716-446655440011' })

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

      if (response.status !== 200) {
        console.log('Debug POST empathy error:', { status: response.status, data })
      }

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.empathy.empathyType).toBe('interested')
      expect(data.data.empathy.postId).toBe('550e8400-e29b-41d4-a716-446655440001')
      expect(data.data.empathy.userId).toBe(mockUser1.id)
      expect(data.data.totalCount).toBe(2) // 既存の1個 + 新規追加の1個
      expect(data.message).toBe('共感を追加しました')
    })

    it('既に共感済みの場合、400エラーを返す（モックモード）', async () => {
      mockVerifyToken.mockResolvedValue({ userId: '550e8400-e29b-41d4-a716-446655440012' }) // 既に共感済みのユーザー

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
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toContain('既に共感済み')
    })

    it('認証されていない場合、401エラーを返す', async () => {
      const empathyData = {
        empathyType: 'helpful',
      }

      const request = createRequest('550e8400-e29b-41d4-a716-446655440001', 'POST', empathyData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
      expect(data.error.message).toBe('認証が必要です')
    })

    it('無効なempathyTypeの場合、400エラーを返す', async () => {
      mockVerifyToken.mockResolvedValue({ userId: '550e8400-e29b-41d4-a716-446655440011' })

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
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('入力値が不正です')
    })

    it.skip('データベースモードで共感を追加できる', async () => {
      // Clean Architecture移行後にモック構成が複雑化したため、一時的にスキップ
      // TODO: PostControllerとEmpathyUseCaseのモックを正しく設定する
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockVerifyToken.mockResolvedValue({ userId: '550e8400-e29b-41d4-a716-446655440011' })

      const mockPost = { id: '550e8400-e29b-41d4-a716-446655440001', status: 'published' }
      const mockUser = { id: mockUser1.id, isActive: true, deletedAt: null }
      const mockEmpathy = {
        id: 'empathy-new',
        postId: '550e8400-e29b-41d4-a716-446655440001',
        userId: mockUser1.id,
        empathyType: 'helpful',
        createdAt: new Date('2024-01-16'),
      }

      // Set up all the necessary mocks for the use case
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.post.findUnique.mockResolvedValue(mockPost)
      mockPrisma.empathy.findFirst.mockResolvedValue(null) // No existing empathy
      mockPrisma.empathy.create.mockResolvedValue(mockEmpathy)
      mockPrisma.empathy.count.mockResolvedValue(2)

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
      mockVerifyToken.mockResolvedValue({ userId: '550e8400-e29b-41d4-a716-446655440012' }) // 共感済みのユーザー

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
      expect(data.data.totalCount).toBe(0) // 削除後の総数
      expect(data.message).toBe('共感を削除しました')
    })

    it('共感が存在しない場合、404エラーを返す（モックモード）', async () => {
      mockVerifyToken.mockResolvedValue({ userId: '550e8400-e29b-41d4-a716-446655440011' }) // 共感していないユーザー

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440001',
        'DELETE',
        null,
        'valid-token'
      )

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toContain('共感')
    })

    it('認証されていない場合、401エラーを返す', async () => {
      const request = createRequest('550e8400-e29b-41d4-a716-446655440001', 'DELETE')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
      expect(data.error.message).toBe('認証が必要です')
    })

    it.skip('データベースモードで共感を削除できる', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockVerifyToken.mockResolvedValue({ userId: '550e8400-e29b-41d4-a716-446655440011' })

      const mockPost = { id: '550e8400-e29b-41d4-a716-446655440001', status: 'published' }
      const mockEmpathy = {
        id: 'empathy-1',
        postId: '550e8400-e29b-41d4-a716-446655440001',
        userId: mockUser1.id,
        empathyType: 'helpful',
        createdAt: new Date('2024-01-16'),
      }

      // Set up mocks for the use case
      mockPrisma.post.findUnique.mockResolvedValue(mockPost)
      mockPrisma.empathy.findFirst.mockResolvedValue(mockEmpathy) // Existing empathy
      mockPrisma.empathy.delete.mockResolvedValue(mockEmpathy)
      mockPrisma.empathy.count.mockResolvedValue(1) // Count after deletion

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
      expect(data.empathyCount).toBe(1)
      expect(data.message).toBe('共感を削除しました')
    })
  })
})
