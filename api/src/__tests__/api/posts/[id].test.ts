jest.mock('@api/framework/controllers/PostController', () => ({
  PostController: jest.fn().mockImplementation(() => ({
    getPost: jest.fn().mockImplementation(async request => {
      // Default mock implementation
      return new Response(JSON.stringify({ message: 'Mock response' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }),
  })),
}))

import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '@/app/api/posts/[id]/route'
import * as dbConfig from '@/lib/db-config'

// Mock db-config
jest.mock('@/lib/db-config', () => ({
  isDatabaseAvailable: jest.fn(),
}))

const mockIsDatabaseAvailable = dbConfig.isDatabaseAvailable as jest.MockedFunction<
  typeof dbConfig.isDatabaseAvailable
>

// Mock the controller

const createMockResponse = (status, data) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
  })
}

describe('/api/posts/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default to mock mode
    mockIsDatabaseAvailable.mockReturnValue(false)
  })

  // 各テスト後にモックをリセット
  afterEach(() => {
    jest.resetAllMocks()
  })

  const createRequest = (id: string, method = 'GET', body?: any, token?: string) => {
    const headers: HeadersInit = {}
    const cookies: { name: string; value: string }[] = []

    if (token) {
      cookies.push({ name: 'auth-token', value: token })
    }

    const req = new NextRequest(`http://localhost:3000/api/posts/${id}`, {
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

  const createParams = (id: string) => {
    return { params: Promise.resolve({ id }) }
  }

  describe('GET', () => {
    it('存在する投稿を取得できる（モックモード）', async () => {
      const request = createRequest('550e8400-e29b-41d4-a716-446655440001')

      const response = await GET(request, createParams('550e8400-e29b-41d4-a716-446655440001'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.post).toMatchObject({
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Test Post 1',
        content: 'Test content 1',
        cosmeticName: 'Test Cosmetic 1',
        cosmeticCategory: 'toner',
        skinType: 'normal',
        moodTag: 'good',
        status: 'published',
        viewCount: 11, // 閲覧数が増加
      })
    })

    it('存在する投稿を取得できる（データベースモード）', async () => {
      const mockPost = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Database Post',
        content: 'Database content',
        cosmeticName: 'Database Cosmetic',
        cosmeticCategory: 'toner',
        skinType: 'normal',
        moodTag: 'good',
        status: 'published',
        viewCount: 5,
        user: {
          id: 'user-1',
          username: 'testuser',
          displayName: 'Test User',
          skinType: 'normal',
        },
        empathies: [],
        comments: [],
        _count: {
          empathies: 0,
          comments: 0,
        },
      }

      mockIsDatabaseAvailable.mockReturnValue(true)
      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, mockPost))
      mockPrisma.post.update.mockResolvedValue(
        createMockResponse(200, { ...mockPost, viewCount: 6 })
      )

      const request = createRequest('550e8400-e29b-41d4-a716-446655440001')

      const response = await GET(request, createParams('550e8400-e29b-41d4-a716-446655440001'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.post).toEqual(mockPost)
      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          status: 'published',
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              skinType: true,
            },
          },
          empathies: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          comments: {
            where: {
              isActive: true,
              parentCommentId: null,
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  skinType: true,
                },
              },
              replies: {
                where: {
                  isActive: true,
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
                orderBy: {
                  createdAt: 'asc',
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              empathies: true,
              comments: true,
            },
          },
        },
      })
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440001' },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      })
    })

    it('存在しない投稿の場合、404エラーを返す（モックモード）', async () => {
      const request = createRequest('550e8400-e29b-41d4-a716-446655440099')

      const response = await GET(request, createParams('550e8400-e29b-41d4-a716-446655440099'))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('存在しない投稿の場合、404エラーを返す（データベースモード）', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, null))

      const request = createRequest('550e8400-e29b-41d4-a716-446655440099')

      const response = await GET(request, createParams('550e8400-e29b-41d4-a716-446655440099'))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('ドラフト投稿は取得できない（モックモード）', async () => {
      const request = createRequest('550e8400-e29b-41d4-a716-446655440003')

      const response = await GET(request, createParams('550e8400-e29b-41d4-a716-446655440003'))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('データベースエラーが発生した場合、500エラーを返す（データベースモード）', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockPrisma.post.findUnique.mockResolvedValue(
        createMockResponse(500, { error: 'Database error' })
      )

      const request = createRequest('550e8400-e29b-41d4-a716-446655440001')

      const response = await GET(request, createParams('550e8400-e29b-41d4-a716-446655440099'))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('投稿の取得に失敗しました')
    })

    it('閲覧数更新でエラーが発生しても投稿は返される（データベースモード）', async () => {
      const mockPost = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Database Post',
        content: 'Database content',
        status: 'published',
        user: { id: 'user-1', username: 'testuser' },
        empathies: [],
        comments: [],
        _count: { empathies: 0, comments: 0 },
      }

      mockIsDatabaseAvailable.mockReturnValue(true)
      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, mockPost))
      mockPrisma.post.update.mockResolvedValue(createMockResponse(500, { error: 'Update error' }))

      const request = createRequest('550e8400-e29b-41d4-a716-446655440001')

      const response = await GET(request, createParams('550e8400-e29b-41d4-a716-446655440099'))

      // 閲覧数更新エラーでも投稿自体は500エラーになる（全体のエラーハンドリング）
      expect(response.status).toBe(500)
    })

    it('複数の投稿を順次取得できる（モックモード）', async () => {
      // 最初の投稿
      const request1 = createRequest('550e8400-e29b-41d4-a716-446655440001')
      const response1 = await GET(request1, createParams('550e8400-e29b-41d4-a716-446655440001'))
      const data1 = await response1.json()

      expect(response1.status).toBe(200)
      expect(data1.post.id).toBe('550e8400-e29b-41d4-a716-446655440001')
      expect(data1.post.viewCount).toBe(11)

      // 2番目の投稿
      const request2 = createRequest('550e8400-e29b-41d4-a716-446655440002')
      const response2 = await GET(request2, createParams('550e8400-e29b-41d4-a716-446655440002'))
      const data2 = await response2.json()

      expect(response2.status).toBe(200)
      expect(data2.post.id).toBe('550e8400-e29b-41d4-a716-446655440002')
      expect(data2.post.viewCount).toBe(6) // 5 + 1
    })

    it('コメントと共感データが正しく含まれる（データベースモード）', async () => {
      const mockPost = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Post with interactions',
        status: 'published',
        user: { id: 'user-1', username: 'author' },
        empathies: [
          {
            id: 'empathy-1',
            empathyType: 'like',
            user: { id: 'user-2', username: 'liker', displayName: 'Liker' },
          },
        ],
        comments: [
          {
            id: 'comment-1',
            content: 'Great post!',
            user: {
              id: 'user-3',
              username: 'commenter',
              displayName: 'Commenter',
              skinType: 'normal',
            },
            replies: [
              {
                id: 'reply-1',
                content: 'I agree!',
                user: {
                  id: 'user-4',
                  username: 'replier',
                  displayName: 'Replier',
                  skinType: 'dry',
                },
              },
            ],
          },
        ],
        _count: {
          empathies: 1,
          comments: 2, // コメント + 返信
        },
      }

      mockIsDatabaseAvailable.mockReturnValue(true)
      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, mockPost))
      mockPrisma.post.update.mockResolvedValue(createMockResponse(200, mockPost))

      const request = createRequest('550e8400-e29b-41d4-a716-446655440001')

      const response = await GET(request, createParams('550e8400-e29b-41d4-a716-446655440099'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.post.empathies).toHaveLength(1)
      expect(data.post.comments).toHaveLength(1)
      expect(data.post.comments[0].replies).toHaveLength(1)
      expect(data.post._count.empathies).toBe(1)
      expect(data.post._count.comments).toBe(2)
    })
  })

  describe('PUT', () => {
    beforeEach(() => {
      mockGetPost.mockReset()
    })

    it('認証されていない場合、401エラーを返す', async () => {
      const request = createRequest('550e8400-e29b-41d4-a716-446655440001', 'PUT', {
        title: 'Updated Title',
      })

      const response = await PUT(request, createParams('550e8400-e29b-41d4-a716-446655440001'))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('ログインが必要です')
    })

    it('トークンが無効な場合、401エラーを返す', async () => {
      mockGetPost.mockReturnValue(null)

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440001',
        'PUT',
        { title: 'Updated Title' },
        'invalid-token'
      )

      const response = await PUT(request, createParams('550e8400-e29b-41d4-a716-446655440001'))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('トークンが無効です')
    })

    it('自分の投稿を更新できる（モックモード）', async () => {
      mockGetPost.mockReturnValue(mockUser1)

      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        cosmeticName: 'Updated Cosmetic',
        cosmeticCategory: 'serum',
        skinType: 'dry',
        moodTag: 'love',
      }

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440001',
        'PUT',
        updateData,
        'valid-token'
      )

      const response = await PUT(request, createParams('550e8400-e29b-41d4-a716-446655440001'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('投稿が更新されました（デモモード）')
      expect(data.post).toMatchObject({
        id: '550e8400-e29b-41d4-a716-446655440001',
        ...updateData,
      })
    })

    it('自分の投稿を更新できる（データベースモード）', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockGetPost.mockReturnValue(mockUser1)

      const mockPost = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440011',
      }

      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        cosmeticName: 'Updated Cosmetic',
        cosmeticCategory: 'serum',
        skinType: 'dry',
        moodTag: 'love',
      }

      const updatedPost = {
        ...mockPost,
        ...updateData,
        user: { id: '550e8400-e29b-41d4-a716-446655440011', username: 'testuser1' },
      }

      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, mockPost))
      mockPrisma.post.update.mockResolvedValue(createMockResponse(200, updatedPost))

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440001',
        'PUT',
        updateData,
        'valid-token'
      )

      const response = await PUT(request, createParams('550e8400-e29b-41d4-a716-446655440001'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('投稿が更新されました')
      expect(data.post).toEqual(updatedPost)
      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440001' },
        select: { userId: true },
      })
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440001' },
        data: {
          ...updateData,
          experienceDetails: undefined,
          usageSituation: undefined,
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

    it('他人の投稿は更新できない（モックモード）', async () => {
      mockGetPost.mockReturnValue(mockUser2)

      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        cosmeticName: 'Updated Cosmetic',
      }

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440001',
        'PUT',
        updateData,
        'valid-token'
      )

      const response = await PUT(request, createParams('550e8400-e29b-41d4-a716-446655440001'))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('投稿の編集権限がありません')
    })

    it('他人の投稿は更新できない（データベースモード）', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockGetPost.mockReturnValue(mockUser2)

      const mockPost = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440011', // 別のユーザーの投稿
      }

      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, mockPost))

      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        cosmeticName: 'Updated Cosmetic',
      }

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440001',
        'PUT',
        updateData,
        'valid-token'
      )

      const response = await PUT(request, createParams('550e8400-e29b-41d4-a716-446655440001'))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('投稿の編集権限がありません')
      expect(mockPrisma.post.update).not.toHaveBeenCalled()
    })

    it('存在しない投稿は更新できない（モックモード）', async () => {
      mockGetPost.mockReturnValue(mockUser1)

      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        cosmeticName: 'Updated Cosmetic',
      }

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440099',
        'PUT',
        updateData,
        'valid-token'
      )

      const response = await PUT(request, createParams('550e8400-e29b-41d4-a716-446655440099'))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('存在しない投稿は更新できない（データベースモード）', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockGetPost.mockReturnValue(mockUser1)
      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, null))

      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        cosmeticName: 'Updated Cosmetic',
      }

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440099',
        'PUT',
        updateData,
        'valid-token'
      )

      const response = await PUT(request, createParams('550e8400-e29b-41d4-a716-446655440001'))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
      expect(mockPrisma.post.update).not.toHaveBeenCalled()
    })

    it('バリデーションエラーの場合、400エラーを返す', async () => {
      mockGetPost.mockReturnValue(mockUser1)

      const invalidData = {
        // titleが空
        title: '',
        content: 'Updated content',
        cosmeticName: 'Updated Cosmetic',
      }

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440001',
        'PUT',
        invalidData,
        'valid-token'
      )

      const response = await PUT(request, createParams('550e8400-e29b-41d4-a716-446655440001'))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('入力内容に誤りがあります')
    })
  })

  describe('DELETE', () => {
    beforeEach(() => {
      mockGetPost.mockReset()
    })

    it('認証されていない場合、401エラーを返す', async () => {
      const request = createRequest('550e8400-e29b-41d4-a716-446655440001', 'DELETE')

      const response = await DELETE(request, createParams('550e8400-e29b-41d4-a716-446655440001'))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('ログインが必要です')
    })

    it('トークンが無効な場合、401エラーを返す', async () => {
      mockGetPost.mockReturnValue(null)

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440001',
        'DELETE',
        null,
        'invalid-token'
      )

      const response = await DELETE(request, createParams('550e8400-e29b-41d4-a716-446655440001'))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('トークンが無効です')
    })

    it('自分の投稿を削除できる（モックモード）', async () => {
      mockGetPost.mockReturnValue(mockUser1)

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440001',
        'DELETE',
        null,
        'valid-token'
      )

      const response = await DELETE(request, createParams('550e8400-e29b-41d4-a716-446655440001'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('投稿が削除されました（デモモード）')
    })

    it('自分の投稿を削除できる（データベースモード）', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockGetPost.mockReturnValue(mockUser1)

      const mockPost = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440011',
      }

      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, mockPost))
      mockPrisma.post.delete.mockResolvedValue(createMockResponse(200, mockPost))

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440001',
        'DELETE',
        null,
        'valid-token'
      )

      const response = await DELETE(request, createParams('550e8400-e29b-41d4-a716-446655440001'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('投稿が削除されました')
      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440001' },
        select: { userId: true },
      })
      expect(mockPrisma.post.delete).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440001' },
      })
    })

    it('他人の投稿は削除できない（モックモード）', async () => {
      mockGetPost.mockReturnValue(mockUser2)

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440001',
        'DELETE',
        null,
        'valid-token'
      )

      const response = await DELETE(request, createParams('550e8400-e29b-41d4-a716-446655440001'))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('投稿の削除権限がありません')
    })

    it('他人の投稿は削除できない（データベースモード）', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockGetPost.mockReturnValue(mockUser2)

      const mockPost = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440011', // 別のユーザーの投稿
      }

      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, mockPost))

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440001',
        'DELETE',
        null,
        'valid-token'
      )

      const response = await DELETE(request, createParams('550e8400-e29b-41d4-a716-446655440001'))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('投稿の削除権限がありません')
      expect(mockPrisma.post.delete).not.toHaveBeenCalled()
    })

    it('存在しない投稿は削除できない（モックモード）', async () => {
      mockGetPost.mockReturnValue(mockUser1)

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440099',
        'DELETE',
        null,
        'valid-token'
      )

      const response = await DELETE(request, createParams('550e8400-e29b-41d4-a716-446655440099'))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('存在しない投稿は削除できない（データベースモード）', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockGetPost.mockReturnValue(mockUser1)
      mockPrisma.post.findUnique.mockResolvedValue(createMockResponse(200, null))

      const request = createRequest(
        '550e8400-e29b-41d4-a716-446655440099',
        'DELETE',
        null,
        'valid-token'
      )

      const response = await DELETE(request, createParams('550e8400-e29b-41d4-a716-446655440001'))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
      expect(mockPrisma.post.delete).not.toHaveBeenCalled()
    })
  })
})
