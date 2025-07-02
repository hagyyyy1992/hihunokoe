import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateRequest } from '@/lib/auth/auth'
import { createApiError, handleApiError } from '@/lib/api-error'
import { isDatabaseAvailable } from '@/lib/prisma'
import { prisma } from '@/lib/prisma'
import { MOCK_POSTS } from '@/lib/mock-data'

const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'コメント内容は必須です')
    .max(1000, 'コメントは1000文字以内で入力してください')
    .trim(),
})

const querySchema = z.object({
  id: z.string().min(1, '投稿IDは必須です'),
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 10)),
})

interface CommentResponse {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    userName: string
    skinType?: string
    profileImageUrl?: string
  }
  replies?: CommentResponse[]
  isEdited: boolean
  canEdit: boolean
  canDelete: boolean
}

// レート制限用のMap（本来はRedisなどを使用）
const commentRateLimit = new Map<string, { count: number; lastReset: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const windowMs = 5 * 1000 // 5秒
  const maxRequests = 1

  const userLimit = commentRateLimit.get(userId)

  if (!userLimit || now - userLimit.lastReset > windowMs) {
    commentRateLimit.set(userId, { count: 1, lastReset: now })
    return true
  }

  if (userLimit.count >= maxRequests) {
    return false
  }

  userLimit.count++
  return true
}

// GET /api/posts/comments - コメント一覧取得 (query parameter使用)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { id: postId, page, limit } = querySchema.parse(Object.fromEntries(searchParams))

    if (!isDatabaseAvailable()) {
      // モックデータから投稿を確認
      const mockPost = MOCK_POSTS.find(p => p.id === postId)
      if (!mockPost) {
        return NextResponse.json(
          createApiError('RESOURCE_NOT_FOUND', '投稿が見つかりませんでした'),
          {
            status: 404,
          }
        )
      }

      // モックコメントを返す
      const mockComments = mockPost.comments || []
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedComments = mockComments.slice(startIndex, endIndex)

      const formattedComments = paginatedComments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        user: {
          id: comment.user.id,
          userName: comment.user.userName,
          skinType: comment.user.skinType || undefined,
        },
        replies: (comment.replies || []).map((reply: typeof comment) => ({
          id: reply.id,
          content: reply.content,
          createdAt: reply.createdAt.toISOString(),
          updatedAt: reply.updatedAt.toISOString(),
          user: {
            id: reply.user.id,
            userName: reply.user.userName,
            skinType: reply.user.skinType || undefined,
          },
          isEdited: reply.createdAt.getTime() !== reply.updatedAt.getTime(),
          canEdit: false,
          canDelete: false,
        })),
        isEdited: comment.createdAt.getTime() !== comment.updatedAt.getTime(),
        canEdit: false,
        canDelete: false,
      }))

      return NextResponse.json({
        comments: formattedComments,
        pagination: {
          page,
          limit,
          total: mockComments.length,
          hasMore: endIndex < mockComments.length,
        },
      })
    }

    const skip = (page - 1) * limit

    // 投稿の存在確認
    const post = await prisma!.post.findUnique({
      where: { id: postId },
      select: { id: true },
    })

    if (!post) {
      return NextResponse.json(createApiError('RESOURCE_NOT_FOUND', '投稿が見つかりませんでした'), {
        status: 404,
      })
    }

    // コメント数の取得（ページネーション用）
    const totalComments = await prisma!.comment.count({
      where: {
        postId,
        isActive: true,
        parentCommentId: null, // トップレベルコメントのみ
      },
    })

    // コメント一覧の取得（返信も含む）
    const comments = await prisma!.comment.findMany({
      where: {
        postId,
        isActive: true,
        parentCommentId: null, // トップレベルコメントのみ
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
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                userName: true,
                skinType: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    const hasMore = skip + comments.length < totalComments

    // レスポンス形式に変換
    const formattedComments: CommentResponse[] = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      user: {
        id: comment.user.id,
        userName: comment.user.userName,
        skinType: comment.user.skinType || undefined,
      },
      replies: comment.replies?.map(reply => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt.toISOString(),
        updatedAt: reply.updatedAt.toISOString(),
        user: {
          id: reply.user.id,
          userName: reply.user.userName,
          skinType: reply.user.skinType || undefined,
        },
        isEdited: reply.createdAt.getTime() !== reply.updatedAt.getTime(),
        canEdit: false, // 現在のユーザー情報がないため、フロントエンドで判定
        canDelete: false,
      })),
      isEdited: comment.createdAt.getTime() !== comment.updatedAt.getTime(),
      canEdit: false, // 現在のユーザー情報がないため、フロントエンドで判定
      canDelete: false,
    }))

    return NextResponse.json({
      comments: formattedComments,
      pagination: {
        page,
        limit,
        total: totalComments,
        hasMore,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/posts/comments - コメント投稿 (query parameter使用)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await authenticateRequest(request)
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')

    if (!postId) {
      return NextResponse.json(createApiError('BAD_REQUEST', '投稿IDが指定されていません'), {
        status: 400,
      })
    }

    if (!isDatabaseAvailable()) {
      // モックデータから投稿を確認
      const mockPost = MOCK_POSTS.find(p => p.id === postId)
      if (!mockPost) {
        return NextResponse.json(
          createApiError('RESOURCE_NOT_FOUND', '投稿が見つかりませんでした'),
          {
            status: 404,
          }
        )
      }

      return NextResponse.json(
        createApiError('SERVICE_UNAVAILABLE', 'データベースが利用できません'),
        { status: 503 }
      )
    }

    // レート制限チェック
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        createApiError('RATE_LIMIT_EXCEEDED', '投稿間隔を空けてください（5秒に1回まで）'),
        { status: 429 }
      )
    }

    const body = await request.json()
    const { content } = createCommentSchema.parse(body)

    // 投稿の存在確認
    const post = await prisma!.post.findUnique({
      where: { id: postId },
      select: { id: true },
    })

    if (!post) {
      return NextResponse.json(createApiError('RESOURCE_NOT_FOUND', '投稿が見つかりませんでした'), {
        status: 404,
      })
    }

    // コメント作成
    const comment = await prisma!.comment.create({
      data: {
        content,
        postId,
        userId,
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
    })

    const response: CommentResponse = {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      user: {
        id: comment.user.id,
        userName: comment.user.userName,
        skinType: comment.user.skinType || undefined,
      },
      replies: [],
      isEdited: false,
      canEdit: true,
      canDelete: true,
    }

    return NextResponse.json(
      {
        success: true,
        comment: response,
        message: 'コメントを投稿しました',
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
