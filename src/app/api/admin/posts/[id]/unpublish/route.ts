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

    // 投稿の存在確認と現在のステータス取得
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, title: true, status: true },
    })

    if (!post) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
    }

    // 投稿を非公開に更新
    await prisma.post.update({
      where: { id: postId },
      data: { status: 'hidden' },
    })

    return NextResponse.json({
      success: true,
      message: '投稿を非公開にしました',
    })
  } catch (error) {
    console.error('Unpublish post error:', error)
    return NextResponse.json({ error: '投稿の非公開に失敗しました' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // POSTメソッドと同じ処理を実行
  return POST(request, context)
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
