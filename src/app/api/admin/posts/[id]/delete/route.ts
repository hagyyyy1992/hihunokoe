import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/auth/admin-middleware'

// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Explicitly define that this route uses dynamic parameters
export async function generateStaticParams() {
  return []
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // 管理者認証チェック
    const authResult = await verifyAdminToken(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 })
    }

    if (!prisma) {
      return NextResponse.json(
        { error: 'データベース接続エラーが発生しました。管理者にお問い合わせください。' },
        { status: 500 }
      )
    }

    const params = await context.params
    const postId = params.id

    // トランザクション内で投稿削除と管理ログ記録を実行
    await prisma.$transaction(async tx => {
      // 投稿の存在確認
      const post = await tx.post.findUnique({
        where: { id: postId },
        select: { id: true, title: true },
      })

      if (!post) {
        throw new Error('投稿が見つかりません')
      }

      // 投稿を削除
      await tx.post.delete({
        where: { id: postId },
      })

      // 管理ログを記録
      await tx.adminLog.create({
        data: {
          adminUserId: authResult.user!.id,
          action: 'DELETE_POST',
          target: postId,
          targetType: 'POST',
          details: {
            postTitle: post.title,
          },
          ipAddress:
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: '投稿を削除しました',
    })
  } catch (error) {
    console.error('Delete post error:', error)
    if (error instanceof Error && error.message === '投稿が見つかりません') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: '投稿の削除に失敗しました' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // POSTメソッドと同じ処理を実行
  return POST(request, context)
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
