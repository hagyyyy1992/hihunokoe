import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/auth/admin-middleware'
import { Prisma } from '@prisma/client'

// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
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

    // クエリパラメータの取得
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    // 検索条件の構築
    const where: Prisma.PostWhereInput = {}

    // ステータスフィルター
    if (status === 'published') {
      where.status = 'published'
    } else if (status === 'unpublished') {
      where.status = { in: ['hidden', 'draft'] }
    }

    // 検索条件
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { cosmeticName: { contains: search, mode: 'insensitive' } },
        { user: { userName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // 並列でカウントと投稿取得を実行
    const [totalCount, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              email: true,
            },
          },
          _count: {
            select: {
              comments: true,
              empathies: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    // レスポンスの整形
    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      cosmeticName: post.cosmeticName,
      status: post.status,
      viewCount: post.viewCount,
      createdAt: post.createdAt.toISOString(),
      publishedAt: post.publishedAt?.toISOString() || null,
      user: {
        id: post.user.id,
        userName: post.user.userName,
        email: post.user.email,
      },
      _count: {
        comments: post._count.comments,
        empathies: post._count.empathies,
      },
    }))

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    })
  } catch (error) {
    console.error('Get posts error:', error)
    return NextResponse.json({ error: '投稿一覧の取得に失敗しました' }, { status: 500 })
  }
}
