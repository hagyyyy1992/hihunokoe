jest.mock('@api/framework/controllers/PostController', () => ({
  PostController: jest.fn().mockImplementation(() => ({
    getPosts: jest.fn().mockImplementation(async request => {
      // Default mock implementation
      return new Response(JSON.stringify({ message: 'Mock response' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }),
  })),
}))

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/posts/route'

// Mock the controller

const createMockResponse = (status, data) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
  })
}

describe('/api/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default to mock mode
    mockIsDatabaseAvailable.mockReturnValue(false)
  })

  const createPostRequest = (body: any, cookies?: { [key: string]: string }) => {
    const headers = new Headers({ 'Content-Type': 'application/json' })
    if (cookies) {
      const cookieString = Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ')
      headers.set('Cookie', cookieString)
    }

    return new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
  }

  const createGetRequest = (searchParams?: Record<string, string>) => {
    const url = new URL('http://localhost:3000/api/posts')
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }

    return new NextRequest(url.toString(), { method: 'GET' })
  }

  const validPostData = {
    title: 'Test Post',
    content: 'This is a test post content',
    cosmeticName: 'Test Cosmetic',
    cosmeticCategory: 'toner',
    skinType: 'normal',
    moodTag: 'good',
    usageSituation: {
      season: 'spring',
      timeOfDay: 'morning',
    },
    experienceDetails: {
      texture: {
        type: 'watery',
        spreadability: 'easy',
        absorption: 'fast',
      },
    },
  }

  describe('POST', () => {
    it('認証されたユーザーが有効な投稿を作成できる（モックモード）', async () => {
      const mockUser = {
        id: 'demo-user-1',
        username: 'testuser',
        email: 'test@example.com',
      }

      mockGetPosts.mockReturnValue(mockUser)

      const request = createPostRequest(validPostData, { 'auth-token': 'valid-token' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.post).toMatchObject({
        userId: mockUser.id,
        title: validPostData.title,
        content: validPostData.content,
        cosmeticName: validPostData.cosmeticName,
        cosmeticCategory: validPostData.cosmeticCategory,
        skinType: validPostData.skinType,
        moodTag: validPostData.moodTag,
      })
      expect(data.message).toBe('投稿が作成されました（デモモード）')
      expect(data.post.id).toMatch(/^mock-post-/)
    })

    it('認証されたユーザーが有効な投稿を作成できる（データベースモード）', async () => {
      const mockUser = {
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        username: 'testuser',
        email: 'test@example.com',
      }

      const mockCreatedPost = {
        id: 'post-id',
        userId: mockUser.id,
        ...validPostData,
        publishedAt: new Date(),
        user: {
          id: mockUser.id,
          username: mockUser.username,
          displayName: null,
          skinType: 'normal',
        },
      }

      mockGetPosts.mockReturnValue(mockUser)
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockPrisma.post.create.mockResolvedValue(createMockResponse(200, mockCreatedPost))

      const request = createPostRequest(validPostData, { 'auth-token': 'valid-token' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.post).toMatchObject({
        id: mockCreatedPost.id,
        userId: mockCreatedPost.userId,
        title: mockCreatedPost.title,
        content: mockCreatedPost.content,
        cosmeticName: mockCreatedPost.cosmeticName,
        cosmeticCategory: mockCreatedPost.cosmeticCategory,
        skinType: mockCreatedPost.skinType,
        moodTag: mockCreatedPost.moodTag,
        user: mockCreatedPost.user,
      })
      expect(data.message).toBe('投稿が作成されました')
      expect(mockPrisma.post.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          title: validPostData.title,
          content: validPostData.content,
          cosmeticName: validPostData.cosmeticName,
          cosmeticCategory: validPostData.cosmeticCategory,
          skinType: validPostData.skinType,
          usageSituation: validPostData.usageSituation,
          experienceDetails: validPostData.experienceDetails,
          moodTag: validPostData.moodTag,
          publishedAt: expect.any(Date),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              skinType: true,
            },
          },
        },
      })
    })

    it('認証トークンがない場合、401エラーを返す', async () => {
      const request = createPostRequest(validPostData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('ログインが必要です')
    })

    it('無効なトークンの場合、401エラーを返す', async () => {
      mockGetPosts.mockReturnValue(null)

      const request = createPostRequest(validPostData, { 'auth-token': 'invalid-token' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('トークンが無効です')
    })

    it('必須フィールドが欠如している場合、バリデーションエラーを返す', async () => {
      const mockUser = {
        id: 'demo-user-1',
        username: 'testuser',
        email: 'test@example.com',
      }

      mockGetPosts.mockReturnValue(mockUser)

      const invalidData = {
        // title が欠如
        content: 'Test content',
        cosmeticName: 'Test Cosmetic',
      }

      const request = createPostRequest(invalidData, { 'auth-token': 'valid-token' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('入力内容に誤りがあります')
      expect(data.details).toBeDefined()
    })

    it('無効なcosmeticCategoryでバリデーションエラーを返す', async () => {
      const mockUser = {
        id: 'demo-user-1',
        username: 'testuser',
        email: 'test@example.com',
      }

      mockGetPosts.mockReturnValue(mockUser)

      const invalidData = {
        ...validPostData,
        cosmeticCategory: 'invalid-category',
      }

      const request = createPostRequest(invalidData, { 'auth-token': 'valid-token' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('入力内容に誤りがあります')
    })

    it('データベースエラーが発生した場合、500エラーを返す', async () => {
      const mockUser = {
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        username: 'testuser',
        email: 'test@example.com',
      }

      mockGetPosts.mockReturnValue(mockUser)
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockPrisma.post.create.mockResolvedValue(createMockResponse(500, { error: 'Database error' }))

      const request = createPostRequest(validPostData, { 'auth-token': 'valid-token' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('投稿の作成に失敗しました')
    })
  })

  describe('GET', () => {
    it('全ての投稿を取得できる（モックモード）', async () => {
      const request = createGetRequest()

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.posts).toHaveLength(2)
      expect(data.posts).toEqual(MOCK_POSTS)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      })
    })

    it('全ての投稿を取得できる（データベースモード）', async () => {
      const mockPosts = [
        { id: 'post-1', title: 'Post 1', user: { id: 'user-1' } },
        { id: 'post-2', title: 'Post 2', user: { id: 'user-2' } },
      ]

      mockIsDatabaseAvailable.mockReturnValue(true)
      mockPrisma.post.findMany.mockResolvedValue(createMockResponse(200, mockPosts))
      mockPrisma.post.count.mockResolvedValue(createMockResponse(200, 2))

      const request = createGetRequest()

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.posts).toEqual(mockPosts)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      })
    })

    it('肌タイプでフィルタリングできる（モックモード）', async () => {
      const request = createGetRequest({ skinType: 'normal' })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.posts).toHaveLength(1)
      expect(data.posts[0].skinType).toBe('normal')
    })

    it('カテゴリでフィルタリングできる（モックモード）', async () => {
      const request = createGetRequest({ category: 'toner' })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.posts).toHaveLength(1)
      expect(data.posts[0].cosmeticCategory).toBe('toner')
    })

    it('検索クエリでフィルタリングできる（モックモード）', async () => {
      const request = createGetRequest({ search: 'Test Post 1' })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.posts).toHaveLength(1)
      expect(data.posts[0].title).toBe('Test Post 1')
    })

    it('ページネーションが正しく動作する（モックモード）', async () => {
      const request = createGetRequest({ page: '1', limit: '1' })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.posts).toHaveLength(1)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 1,
        total: 2,
        pages: 2,
      })
    })

    it('データベースエラーが発生した場合、500エラーを返す（データベースモード）', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockPrisma.post.findMany.mockResolvedValue(
        createMockResponse(500, { error: 'Database error' })
      )

      const request = createGetRequest()

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('投稿の取得に失敗しました')
    })

    it('複数のフィルターを組み合わせて使用できる（モックモード）', async () => {
      const request = createGetRequest({
        skinType: 'dry',
        category: 'serum',
        moodTag: 'love',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.posts).toHaveLength(1)
      expect(data.posts[0]).toMatchObject({
        skinType: 'dry',
        cosmeticCategory: 'serum',
        moodTag: 'love',
      })
    })

    it('デフォルトのページネーション値が適用される', async () => {
      const request = createGetRequest()

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(10)
    })
  })
})
