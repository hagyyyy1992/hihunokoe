import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateRequest } from '@/lib/auth/auth'
import { createApiError, handleApiError } from '@/lib/api-error'
import { isDatabaseAvailable } from '@/lib/prisma'
import { prisma } from '@/lib/prisma'

const updateCommentSchema = z.object({
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

// PUT /api/comments/[id] - コメント編集
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await authenticateRequest(request)
    const { id: commentId } = await params

    if (!isDatabaseAvailable()) {
      return NextResponse.json(
        createApiError('SERVICE_UNAVAILABLE', 'データベースが利用できません'),
        { status: 503 }
      )
    }

    const body = await request.json()
    const { content } = updateCommentSchema.parse(body)

    // コメントの存在確認と権限チェック
    const existingComment = await prisma!.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        userId: true,
        isPublished: true,
      },
    })

    if (!existingComment || !existingComment.isPublished) {
      return NextResponse.json(
        createApiError('RESOURCE_NOT_FOUND', 'コメントが見つかりませんでした'),
        { status: 404 }
      )
    }

    // 権限チェック（コメント投稿者のみ編集可能）
    if (existingComment.userId !== userId) {
      return NextResponse.json(createApiError('FORBIDDEN', 'コメントを編集する権限がありません'), {
        status: 403,
      })
    }

    // コメント更新
    const updatedComment = await prisma!.comment.update({
      where: { id: commentId },
      data: { content },
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
      id: updatedComment.id,
      content: updatedComment.content,
      createdAt: updatedComment.createdAt.toISOString(),
      updatedAt: updatedComment.updatedAt.toISOString(),
      user: {
        id: updatedComment.user.id,
        userName: updatedComment.user.userName,
        skinType: updatedComment.user.skinType || undefined,
      },
      replies: [],
      isEdited: updatedComment.createdAt.getTime() !== updatedComment.updatedAt.getTime(),
      canEdit: true,
      canDelete: true,
    }

    return NextResponse.json({
      success: true,
      comment: response,
      message: 'コメントを編集しました',
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/comments/[id] - コメント削除（論理削除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await authenticateRequest(request)
    const { id: commentId } = await params

    if (!isDatabaseAvailable()) {
      return NextResponse.json(
        createApiError('SERVICE_UNAVAILABLE', 'データベースが利用できません'),
        { status: 503 }
      )
    }

    // コメントの存在確認と権限チェック
    const existingComment = await prisma!.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        userId: true,
        isPublished: true,
      },
    })

    if (!existingComment || !existingComment.isPublished) {
      return NextResponse.json(
        createApiError('RESOURCE_NOT_FOUND', 'コメントが見つかりませんでした'),
        { status: 404 }
      )
    }

    // 権限チェック（コメント投稿者のみ削除可能）
    if (existingComment.userId !== userId) {
      return NextResponse.json(createApiError('FORBIDDEN', 'コメントを削除する権限がありません'), {
        status: 403,
      })
    }

    // 論理削除（isActiveをfalseに設定）
    await prisma!.comment.update({
      where: { id: commentId },
      data: { isPublished: false },
    })

    return NextResponse.json({
      success: true,
      message: 'コメントを削除しました',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
