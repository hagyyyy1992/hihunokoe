// Mock the modules first
jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    post: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
  isDatabaseAvailable: jest.fn(),
}))

jest.mock('../../../src/lib/mock-data', () => ({
  MOCK_POSTS: [
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
      user: { id: 'user-2', userName: 'testuser2' },
    },
    {
      id: 'draft-post',
      title: 'Draft Post',
      content: 'Draft content',
      cosmeticName: 'Draft Cosmetic',
      status: 'draft',
      viewCount: 0,
      user: { id: 'user-3', userName: 'testuser3' },
    },
  ],
}))

import { NextRequest } from 'next/server'
import { GET } from '../../../src/app/api/posts/[id]/route'
import * as prismaModule from '../../../src/lib/prisma'
import { MOCK_POSTS } from '../../../src/lib/mock-data'

const mockIsDatabaseAvailable = prismaModule.isDatabaseAvailable as jest.MockedFunction<
  typeof prismaModule.isDatabaseAvailable
>
const mockPrisma = prismaModule.prisma as any

describe('/api/posts/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default to mock mode
    mockIsDatabaseAvailable.mockReturnValue(false)
  })

  const createRequest = (id: string) => {
    return new NextRequest(`http://localhost:3000/api/posts/${id}`, {
      method: 'GET',
    })
  }

  const createParams = (id: string) => {
    return Promise.resolve({ id })
  }

  describe('GET', () => {
    it('存在する投稿を取得できる（モックモード）', async () => {
      const request = createRequest('mock-post-1')
      const params = createParams('mock-post-1')

      const response = await GET(request, { params })
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
      const params = createParams('post-1')

      const response = await GET(request, { params })
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
              displayName: true,
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
                  displayName: true,
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
                  displayName: true,
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
                      displayName: true,
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
      const params = createParams('non-existent-post')

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('存在しない投稿の場合、404エラーを返す（データベースモード）', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockPrisma.post.findUnique.mockResolvedValue(null)

      const request = createRequest('non-existent-post')
      const params = createParams('non-existent-post')

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('ドラフト投稿は取得できない（モックモード）', async () => {
      const request = createRequest('draft-post')
      const params = createParams('draft-post')

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('投稿が見つかりません')
    })

    it('データベースエラーが発生した場合、500エラーを返す（データベースモード）', async () => {
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockPrisma.post.findUnique.mockRejectedValue(new Error('Database error'))

      const request = createRequest('post-1')
      const params = createParams('post-1')

      const response = await GET(request, { params })
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
      const params = createParams('post-1')

      const response = await GET(request, { params })

      // 閲覧数更新エラーでも投稿自体は500エラーになる（全体のエラーハンドリング）
      expect(response.status).toBe(500)
    })

    it('複数の投稿を順次取得できる（モックモード）', async () => {
      // 最初の投稿
      const request1 = createRequest('mock-post-1')
      const params1 = createParams('mock-post-1')
      const response1 = await GET(request1, { params: params1 })
      const data1 = await response1.json()

      expect(response1.status).toBe(200)
      expect(data1.post.id).toBe('mock-post-1')
      expect(data1.post.viewCount).toBe(11)

      // 2番目の投稿
      const request2 = createRequest('mock-post-2')
      const params2 = createParams('mock-post-2')
      const response2 = await GET(request2, { params: params2 })
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
      const params = createParams('post-1')

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.post.empathies).toHaveLength(1)
      expect(data.post.comments).toHaveLength(1)
      expect(data.post.comments[0].replies).toHaveLength(1)
      expect(data.post._count.empathies).toBe(1)
      expect(data.post._count.comments).toBe(2)
    })
  })
})
