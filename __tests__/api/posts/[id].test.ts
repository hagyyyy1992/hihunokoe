// Mock the modules first
jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    post: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
  isDatabaseAvailable: jest.fn(),
}))

jest.mock('../../../src/lib/mock-data', () => {
  // モックデータを変数として定義して、テスト間で共有できるようにする
  const mockPostsData = [
    {
      id: 'mock-post-1',
      title: 'Test Post 1',
      content: 'Test content 1',
      cosmeticName: 'Test Cosmetic 1',
      cosmeticCategory: 'toner',
      skinType: 'normal',
      moodTag: 'good',
      status: 'published',
      viewCount: 10,
      userId: 'user-1',
      user: { id: 'user-1', userName: 'testuser1' },
    },
    {
      id: 'mock-post-2',
      title: 'Test Post 2',
      content: 'Test content 2',
      cosmeticName: 'Test Cosmetic 2',
      cosmeticCategory: 'serum',
      skinType: 'dry',
      moodTag: 'love',
      status: 'published',
      viewCount: 5,
      userId: 'user-2',
      user: { id: 'user-2', userName: 'testuser2' },
    },
    {
      id: 'draft-post',
      title: 'Draft Post',
      content: 'Draft content',
      cosmeticName: 'Draft Cosmetic',
      status: 'draft',
      viewCount: 0,
      userId: 'user-3',
      user: { id: 'user-3', userName: 'testuser3' },
    },
  ]

  return {
    // 各テスト実行前に元のデータをコピーして返す
    get MOCK_POSTS() {
      return [...mockPostsData]
    },
  }
})

import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '../../../src/app/api/posts/[id]/route'
import * as prismaModule from '../../../src/lib/prisma'
import { MOCK_POSTS } from '../../../src/lib/mock-data'
import { verifyToken } from '../../../src/lib/auth/auth'

const mockIsDatabaseAvailable = prismaModule.isDatabaseAvailable as jest.MockedFunction<
  typeof prismaModule.isDatabaseAvailable
>
const mockPrisma = prismaModule.prisma as any

// Auth mocking
jest.mock('../../../src/lib/auth/auth', () => ({
  verifyToken: jest.fn(),
}))

const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>

// AuthUser型に合わせたモックユーザー
const mockUser1 = { id: 'user-1', userName: 'testuser1', email: 'user1@example.com' }
const mockUser2 = { id: 'user-2', userName: 'testuser2', email: 'user2@example.com' }
const mockUser3 = { id: 'user-3', userName: 'testuser3', email: 'user3@example.com' }

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
    return { id }
  }

  describe('GET', () => {
    it('存在する投稿を取得できる（モックモード）', async () => {
      const request = createRequest('mock-post-1')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.post).toMatchObject({
        id: 'mock-post-1',
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
        id: 'post-1',
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
          userName: 'testuser',
          displayName: 'Test User',
          skinType: 'normal',
          profileImageUrl: null,
        },
        empathies: [],
        comments: [],
        _count: {
          empathies: 0,
          comments: 0,
        },
      }

      mockIsDatabaseAvailable.mockReturnValue(true)
      mockPrisma.post.findUnique.mockResolvedValue(mockPost)
      mockPrisma.post.update.mockResolvedValue({ ...mockPost, viewCount: 6 })

      const request = createRequest('post-1')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.post).toEqual(mockPost)
      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'post-1',
          status: 'published',
        },
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              skinType: true,
              profileImageUrl: true,
            },
          },
          empathies: {
            include: {
              user: {
                select: {
                  id: true,
                  userName: true,
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
                  userName: true,
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
                      userName: true,
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
        where: { id: 'post-1' },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      })
    })

    it('存在しない投稿の場合、404エラーを返す（モックモード）', async () => {
      const request = createRequest('non-existent-post')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('存在しない投稿の場合、404エラーを返す（データベースモード）', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockPrisma.post.findUnique.mockResolvedValue(null)

      const request = createRequest('non-existent-post')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('ドラフト投稿は取得できない（モックモード）', async () => {
      const request = createRequest('draft-post')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('データベースエラーが発生した場合、500エラーを返す（データベースモード）', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockPrisma.post.findUnique.mockRejectedValue(new Error('Database error'))

      const request = createRequest('post-1')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('投稿の取得に失敗しました')
    })

    it('閲覧数更新でエラーが発生しても投稿は返される（データベースモード）', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Database Post',
        content: 'Database content',
        status: 'published',
        user: { id: 'user-1', userName: 'testuser' },
        empathies: [],
        comments: [],
        _count: { empathies: 0, comments: 0 },
      }

      mockIsDatabaseAvailable.mockReturnValue(true)
      mockPrisma.post.findUnique.mockResolvedValue(mockPost)
      mockPrisma.post.update.mockRejectedValue(new Error('Update error'))

      const request = createRequest('post-1')

      const response = await GET(request)

      // 閲覧数更新エラーでも投稿自体は500エラーになる（全体のエラーハンドリング）
      expect(response.status).toBe(500)
    })

    it('複数の投稿を順次取得できる（モックモード）', async () => {
      // 最初の投稿
      const request1 = createRequest('mock-post-1')
      const response1 = await GET(request1)
      const data1 = await response1.json()

      expect(response1.status).toBe(200)
      expect(data1.post.id).toBe('mock-post-1')
      expect(data1.post.viewCount).toBe(11)

      // 2番目の投稿
      const request2 = createRequest('mock-post-2')
      const response2 = await GET(request2)
      const data2 = await response2.json()

      expect(response2.status).toBe(200)
      expect(data2.post.id).toBe('mock-post-2')
      expect(data2.post.viewCount).toBe(6) // 5 + 1
    })

    it('コメントと共感データが正しく含まれる（データベースモード）', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Post with interactions',
        status: 'published',
        user: { id: 'user-1', userName: 'author' },
        empathies: [
          {
            id: 'empathy-1',
            empathyType: 'like',
            user: { id: 'user-2', userName: 'liker', displayName: 'Liker' },
          },
        ],
        comments: [
          {
            id: 'comment-1',
            content: 'Great post!',
            user: {
              id: 'user-3',
              userName: 'commenter',
              displayName: 'Commenter',
              skinType: 'normal',
            },
            replies: [
              {
                id: 'reply-1',
                content: 'I agree!',
                user: {
                  id: 'user-4',
                  userName: 'replier',
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
      mockPrisma.post.findUnique.mockResolvedValue(mockPost)
      mockPrisma.post.update.mockResolvedValue(mockPost)

      const request = createRequest('post-1')

      const response = await GET(request)
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
      mockVerifyToken.mockReset()
    })

    it('認証されていない場合、401エラーを返す', async () => {
      const request = createRequest('mock-post-1', 'PUT', { title: 'Updated Title' })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('ログインが必要です')
    })

    it('トークンが無効な場合、401エラーを返す', async () => {
      mockVerifyToken.mockReturnValue(null)

      const request = createRequest(
        'mock-post-1',
        'PUT',
        { title: 'Updated Title' },
        'invalid-token'
      )

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('トークンが無効です')
    })

    it('自分の投稿を更新できる（モックモード）', async () => {
      mockVerifyToken.mockReturnValue(mockUser1)

      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        cosmeticName: 'Updated Cosmetic',
        cosmeticCategory: 'serum',
        skinType: 'dry',
        moodTag: 'love',
      }

      const request = createRequest('mock-post-1', 'PUT', updateData, 'valid-token')

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('投稿が更新されました（デモモード）')
      expect(data.post).toMatchObject({
        id: 'mock-post-1',
        ...updateData,
      })
    })

    it('自分の投稿を更新できる（データベースモード）', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockVerifyToken.mockReturnValue(mockUser1)

      const mockPost = {
        id: 'post-1',
        userId: 'user-1',
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
        user: { id: 'user-1', userName: 'testuser1' },
      }

      mockPrisma.post.findUnique.mockResolvedValue(mockPost)
      mockPrisma.post.update.mockResolvedValue(updatedPost)

      const request = createRequest('post-1', 'PUT', updateData, 'valid-token')

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('投稿が更新されました')
      expect(data.post).toEqual(updatedPost)
      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        select: { userId: true },
      })
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: {
          ...updateData,
          experienceDetails: undefined,
          usageSituation: undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              skinType: true,
            },
          },
        },
      })
    })

    it('他人の投稿は更新できない（モックモード）', async () => {
      mockVerifyToken.mockReturnValue(mockUser2)

      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        cosmeticName: 'Updated Cosmetic',
      }

      const request = createRequest('mock-post-1', 'PUT', updateData, 'valid-token')

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('投稿の編集権限がありません')
    })

    it('他人の投稿は更新できない（データベースモード）', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockVerifyToken.mockReturnValue(mockUser2)

      const mockPost = {
        id: 'post-1',
        userId: 'user-1', // 別のユーザーの投稿
      }

      mockPrisma.post.findUnique.mockResolvedValue(mockPost)

      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        cosmeticName: 'Updated Cosmetic',
      }

      const request = createRequest('post-1', 'PUT', updateData, 'valid-token')

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('投稿の編集権限がありません')
      expect(mockPrisma.post.update).not.toHaveBeenCalled()
    })

    it('存在しない投稿は更新できない（モックモード）', async () => {
      mockVerifyToken.mockReturnValue(mockUser1)

      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        cosmeticName: 'Updated Cosmetic',
      }

      const request = createRequest('non-existent-post', 'PUT', updateData, 'valid-token')

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('存在しない投稿は更新できない（データベースモード）', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockVerifyToken.mockReturnValue(mockUser1)
      mockPrisma.post.findUnique.mockResolvedValue(null)

      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        cosmeticName: 'Updated Cosmetic',
      }

      const request = createRequest('non-existent-post', 'PUT', updateData, 'valid-token')

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
      expect(mockPrisma.post.update).not.toHaveBeenCalled()
    })

    it('バリデーションエラーの場合、400エラーを返す', async () => {
      mockVerifyToken.mockReturnValue(mockUser1)

      const invalidData = {
        // titleが空
        title: '',
        content: 'Updated content',
        cosmeticName: 'Updated Cosmetic',
      }

      const request = createRequest('mock-post-1', 'PUT', invalidData, 'valid-token')

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('入力内容に誤りがあります')
    })
  })

  describe('DELETE', () => {
    beforeEach(() => {
      mockVerifyToken.mockReset()
    })

    it('認証されていない場合、401エラーを返す', async () => {
      const request = createRequest('mock-post-1', 'DELETE')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('ログインが必要です')
    })

    it('トークンが無効な場合、401エラーを返す', async () => {
      mockVerifyToken.mockReturnValue(null)

      const request = createRequest('mock-post-1', 'DELETE', null, 'invalid-token')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('トークンが無効です')
    })

    it('自分の投稿を削除できる（モックモード）', async () => {
      mockVerifyToken.mockReturnValue(mockUser1)

      const request = createRequest('mock-post-1', 'DELETE', null, 'valid-token')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('投稿が削除されました（デモモード）')
    })

    it('自分の投稿を削除できる（データベースモード）', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockVerifyToken.mockReturnValue(mockUser1)

      const mockPost = {
        id: 'post-1',
        userId: 'user-1',
      }

      mockPrisma.post.findUnique.mockResolvedValue(mockPost)
      mockPrisma.post.delete.mockResolvedValue(mockPost)

      const request = createRequest('post-1', 'DELETE', null, 'valid-token')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('投稿が削除されました')
      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        select: { userId: true },
      })
      expect(mockPrisma.post.delete).toHaveBeenCalledWith({
        where: { id: 'post-1' },
      })
    })

    it('他人の投稿は削除できない（モックモード）', async () => {
      mockVerifyToken.mockReturnValue(mockUser2)

      const request = createRequest('mock-post-1', 'DELETE', null, 'valid-token')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('投稿の削除権限がありません')
    })

    it('他人の投稿は削除できない（データベースモード）', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockVerifyToken.mockReturnValue(mockUser2)

      const mockPost = {
        id: 'post-1',
        userId: 'user-1', // 別のユーザーの投稿
      }

      mockPrisma.post.findUnique.mockResolvedValue(mockPost)

      const request = createRequest('post-1', 'DELETE', null, 'valid-token')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('投稿の削除権限がありません')
      expect(mockPrisma.post.delete).not.toHaveBeenCalled()
    })

    it('存在しない投稿は削除できない（モックモード）', async () => {
      mockVerifyToken.mockReturnValue(mockUser1)

      const request = createRequest('non-existent-post', 'DELETE', null, 'valid-token')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('存在しない投稿は削除できない（データベースモード）', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockVerifyToken.mockReturnValue(mockUser1)
      mockPrisma.post.findUnique.mockResolvedValue(null)

      const request = createRequest('non-existent-post', 'DELETE', null, 'valid-token')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
      expect(mockPrisma.post.delete).not.toHaveBeenCalled()
    })
  })
})
