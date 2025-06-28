import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isAdmin } from '@/lib/auth/auth'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { MOCK_USERS, MOCK_POSTS } from '@/lib/mock-data'

export async function GET(req: NextRequest) {
  const token =
    req.headers.get('authorization')?.replace('Bearer ', '') || req.cookies.get('auth-token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
  }

  const user = verifyToken(token)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
  }

  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
  }
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
