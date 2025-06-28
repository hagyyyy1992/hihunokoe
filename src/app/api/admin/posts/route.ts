import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin-middleware'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { MOCK_POSTS, MOCK_USERS } from '@/lib/mock-data'

const handler = async (req: NextRequest) => {
  try {
    if (!isDatabaseAvailable()) {
      // モックデータを使用
      const mockPostsWithUsers = MOCK_POSTS.map(post => {
        const user = MOCK_USERS.find(u => u.id === post.userId)
        return {
          id: post.id,
          title: post.title,
          content: post.content,
          userName: user?.userName || 'Unknown',
          status: post.status || 'published',
          empathyCount: post.empathyCount || 0,
          viewCount: post.viewCount || 0,
          createdAt: post.createdAt || new Date().toISOString(),
          cosmeticName: post.cosmeticName,
        }
      })

      return NextResponse.json(mockPostsWithUsers)
    }

    // データベースから投稿一覧を取得
    const posts = await prisma!.post.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        status: true,
        empathyCount: true,
        viewCount: true,
        createdAt: true,
        cosmeticName: true,
        user: {
          select: {
            userName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const postsWithUserName = posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      userName: post.user.userName,
      status: post.status,
      empathyCount: post.empathyCount,
      viewCount: post.viewCount,
      createdAt: post.createdAt.toISOString(),
      cosmeticName: post.cosmeticName,
    }))

    return NextResponse.json(postsWithUserName)
  } catch (error) {
    console.error('Posts fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export const GET = withAdminAuth(handler)
