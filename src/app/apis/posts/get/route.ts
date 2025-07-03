import { NextRequest, NextResponse } from 'next/server'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { MOCK_POSTS } from '@/lib/mock-data'

// GET: 投稿の取得 (query parameter使用)
export async function GET(request: NextRequest) {
  try {
    // クエリパラメータからIDを取得
    const url = new URL(request.url)
    const postId = url.searchParams.get('id')

    if (!postId) {
      return NextResponse.json({ error: 'IDが指定されていません' }, { status: 400 })
    }

    // UUID形式の検証
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(postId)) {
      return NextResponse.json({ error: '無効なIDです' }, { status: 400 })
    }

    if (!isDatabaseAvailable()) {
      // モックモードでの投稿取得
      const post = MOCK_POSTS.find(p => p.id === postId && p.status === 'published')

      if (!post) {
        return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
      }

      // 閲覧数を増加（モックなので実際には増加しない）
      const postWithIncrementedViews = {
        ...post,
        viewCount: post.viewCount + 1,
      }

      return NextResponse.json({ post: postWithIncrementedViews })
    }

    const post = await prisma!.post.findUnique({
      where: {
        id: postId,
        status: 'published',
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            skinType: true,
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

    if (!post) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
    }

    // 閲覧数を増加
    await prisma!.post.update({
      where: { id: postId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Post fetch error:', error)
    return NextResponse.json({ error: '投稿の取得に失敗しました' }, { status: 500 })
  }
}
