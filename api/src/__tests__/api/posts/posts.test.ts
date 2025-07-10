import { NextRequest } from 'next/server'
import { PostController } from '@api/framework/controllers/PostController'

// モック設定
const mockGetPosts = jest.fn()
const mockCreatePost = jest.fn()

jest.mock('@api/framework/controllers/PostController', () => {
  return {
    PostController: jest.fn().mockImplementation(() => {
      return {
        getPosts: mockGetPosts,
        createPost: mockCreatePost,
      }
    }),
  }
})

describe('/api/posts', () => {
  let GET: typeof import('@/app/api/posts/route').GET
  let POST: typeof import('@/app/api/posts/route').POST

  beforeAll(async () => {
    // モック設定後にモジュールをインポート
    const module = await import('@/app/api/posts/route')
    GET = module.GET
    POST = module.POST
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('投稿一覧を取得できる', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          title: 'Test Post 1',
          content: 'Test content 1',
          cosmeticName: 'Test Cosmetic 1',
          user: { id: 'user-1', username: 'testuser1' },
          empathyCount: 5,
          viewCount: 10,
        },
        {
          id: 'post-2',
          title: 'Test Post 2',
          content: 'Test content 2',
          cosmeticName: 'Test Cosmetic 2',
          user: { id: 'user-2', username: 'testuser2' },
          empathyCount: 3,
          viewCount: 8,
        },
      ]

      const mockResponse = new Response(
        JSON.stringify({
          success: true,
          posts: mockPosts,
          pagination: {
            total: 2,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )

      mockGetPosts.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/posts')

      const response = await GET(request)
      const data = await response.json()

      expect(mockGetPosts).toHaveBeenCalledWith(request)
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.posts).toHaveLength(2)
      expect(data.posts[0].title).toBe('Test Post 1')
      expect(data.pagination.total).toBe(2)
    })

    it('検索パラメータで投稿をフィルタリングできる', async () => {
      const mockResponse = new Response(
        JSON.stringify({
          success: true,
          posts: [
            {
              id: 'post-1',
              title: 'Toner Review',
              content: 'Great toner for dry skin',
              cosmeticName: 'Hydrating Toner',
              cosmeticCategory: 'toner',
              user: { id: 'user-1', username: 'testuser1' },
            },
          ],
          pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )

      mockGetPosts.mockResolvedValue(mockResponse)

      const request = new NextRequest(
        'http://localhost:3000/api/posts?category=toner&search=hydrating'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.posts).toHaveLength(1)
      expect(data.posts[0].cosmeticCategory).toBe('toner')
    })

    it('投稿が見つからない場合は空の配列を返す', async () => {
      const mockResponse = new Response(
        JSON.stringify({
          success: true,
          posts: [],
          pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )

      mockGetPosts.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/posts?search=nonexistent')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.posts).toHaveLength(0)
      expect(data.pagination.total).toBe(0)
    })
  })

  describe('POST', () => {
    it('新しい投稿を作成できる', async () => {
      const newPost = {
        id: 'post-new',
        title: 'New Post Title',
        content: 'New post content',
        cosmeticName: 'New Cosmetic',
        cosmeticCategory: 'moisturizer',
        skinType: 'dry',
        moodTag: 'good',
        status: 'published',
        userId: 'user-1',
        user: { id: 'user-1', username: 'testuser' },
      }

      const mockResponse = new Response(
        JSON.stringify({
          success: true,
          post: newPost,
          message: '投稿が作成されました',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      )

      mockCreatePost.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          title: 'New Post Title',
          content: 'New post content',
          cosmeticName: 'New Cosmetic',
          cosmeticCategory: 'moisturizer',
          skinType: 'dry',
          moodTag: 'good',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(mockCreatePost).toHaveBeenCalledWith(request)
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.post.title).toBe('New Post Title')
      expect(data.message).toBe('投稿が作成されました')
    })

    it('認証されていない場合は401を返す', async () => {
      const mockResponse = new Response(JSON.stringify({ error: 'ログインが必要です' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })

      mockCreatePost.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Post',
          content: 'Content',
          cosmeticName: 'Cosmetic',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('ログインが必要です')
    })

    it('必須フィールドが不足している場合は400を返す', async () => {
      const mockResponse = new Response(JSON.stringify({ error: 'タイトルは必須です' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })

      mockCreatePost.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          content: 'Content without title',
          cosmeticName: 'Cosmetic',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('タイトルは必須です')
    })

    it('投稿内容が不適切な場合は400を返す', async () => {
      const mockResponse = new Response(
        JSON.stringify({ error: '投稿内容に不適切な表現が含まれています' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )

      mockCreatePost.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          title: 'Inappropriate Content',
          content: 'Content with inappropriate words',
          cosmeticName: 'Cosmetic',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('投稿内容に不適切な表現が含まれています')
    })

    it('サーバーエラーの場合は500を返す', async () => {
      mockCreatePost.mockRejectedValue(new Error('Database connection error'))

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          title: 'Test Post',
          content: 'Test content',
          cosmeticName: 'Test Cosmetic',
        }),
      })

      await expect(POST(request)).rejects.toThrow('Database connection error')
    })
  })
})
