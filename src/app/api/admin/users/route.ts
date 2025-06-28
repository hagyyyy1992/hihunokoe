import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin-middleware'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { MOCK_USERS, MOCK_POSTS } from '@/lib/mock-data'

const handler = async () => {
  try {
    if (!isDatabaseAvailable()) {
      // モックデータを使用
      const mockUsersWithStats = MOCK_USERS.map(user => ({
        id: user.id,
        userName: user.userName,
        email: user.email,
        isActive: user.isActive ?? true,
        role: 'USER',
        skinType: user.skinType,
        createdAt: user.createdAt || new Date().toISOString(),
        postCount: MOCK_POSTS.filter(post => post.userId === user.id).length,
      }))

      return NextResponse.json(mockUsersWithStats)
    }

    // データベースからユーザー一覧を取得
    const users = await prisma!.user.findMany({
      select: {
        id: true,
        userName: true,
        email: true,
        isActive: true,
        role: true,
        skinType: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const usersWithStats = users.map(user => ({
      id: user.id,
      userName: user.userName,
      email: user.email,
      isActive: user.isActive,
      role: user.role,
      skinType: user.skinType,
      createdAt: user.createdAt.toISOString(),
      postCount: user._count.posts,
    }))

    return NextResponse.json(usersWithStats)
  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export const GET = withAdminAuth(handler)
