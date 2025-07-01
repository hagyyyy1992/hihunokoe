import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateRequest } from '@/lib/auth/auth'
import { createApiError, handleApiError } from '@/lib/api-error'
import { isDatabaseAvailable } from '@/lib/prisma'
import { prisma } from '@/lib/prisma'

const createReplySchema = z.object({
  content: z
    .string()
    .min(1, 'コメント内容は必須です')
    .max(1000, 'コメントは1000文字以内で入力してください')
    .trim(),
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
const replyRateLimit = new Map<string, { count: number; lastReset: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const windowMs = 30 * 1000 // 30秒
  const maxRequests = 1

  const userLimit = replyRateLimit.get(userId)

  if (!userLimit || now - userLimit.lastReset > windowMs) {
    replyRateLimit.set(userId, { count: 1, lastReset: now })
    return true
  }

  if (userLimit.count >= maxRequests) {
    return false
  }

  userLimit.count++
  return true
}

// POST /api/comments/[id]/reply - 返信投稿
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await authenticateRequest(request)
    const { id: parentCommentId } = await params

    if (!isDatabaseAvailable()) {
      return NextResponse.json(
        createApiError('SERVICE_UNAVAILABLE', 'データベースが利用できません'),
        { status: 503 }
      )
    }

    // レート制限チェック
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        createApiError('RATE_LIMIT_EXCEEDED', '投稿間隔を空けてください（30秒に1回まで）'),
        { status: 429 }
      )
    }

    const body = await request.json()
    const { content } = createReplySchema.parse(body)

    // 親コメントの存在確認
    const parentComment = await prisma!.comment.findUnique({
      where: { id: parentCommentId },
      select: {
        id: true,
        postId: true,
        isActive: true,
        parentCommentId: true,
      },
    })

    if (!parentComment || !parentComment.isActive) {
      return NextResponse.json(
        createApiError('RESOURCE_NOT_FOUND', 'コメントが見つかりませんでした'),
        { status: 404 }
      )
    }

    // 返信の階層制限（最大2階層まで）
    if (parentComment.parentCommentId !== null) {
      return NextResponse.json(createApiError('BAD_REQUEST', '返信は2階層までしか投稿できません'), {
        status: 400,
      })
    }

    // 返信作成
    const reply = await prisma!.comment.create({
      data: {
        content,
        postId: parentComment.postId,
        userId,
        parentCommentId,
        isActive: true,
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
      },
    })

    const response: CommentResponse = {
      id: reply.id,
      content: reply.content,
      createdAt: reply.createdAt.toISOString(),
      updatedAt: reply.updatedAt.toISOString(),
      user: {
        id: reply.user.id,
        userName: reply.user.userName,
        skinType: reply.user.skinType || undefined,
        profileImageUrl: reply.user.profileImageUrl || undefined,
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
        message: '返信を投稿しました',
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
