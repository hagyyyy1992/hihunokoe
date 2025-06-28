import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isAdmin, logAdminAction } from '@/lib/auth/auth'
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
    let users: Array<{
      id: string
      userName: string
      email: string
      isActive: boolean
      role: string
      skinType: string
      createdAt: string
      postCount: number
    }>

    if (!isDatabaseAvailable()) {
      // モックデータを使用
      users = MOCK_USERS.map(user => ({
        id: user.id,
        userName: user.userName,
        email: user.email,
        isActive: user.isActive ?? true,
        role: 'USER',
        skinType: user.skinType || '',
        createdAt: user.createdAt
          ? user.createdAt instanceof Date
            ? user.createdAt.toISOString()
            : user.createdAt
          : new Date().toISOString(),
        postCount: MOCK_POSTS.filter(post => post.userId === user.id).length,
      }))
    } else {
      // データベースからユーザー一覧を取得
      const dbUsers = await prisma!.user.findMany({
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

      users = dbUsers.map(user => ({
        id: user.id,
        userName: user.userName,
        email: user.email,
        isActive: user.isActive,
        role: user.role,
        skinType: user.skinType || '',
        createdAt: user.createdAt.toISOString(),
        postCount: user._count.posts,
      }))
    }

    // CSVヘッダー
    const csvHeader = 'ID,ユーザー名,メールアドレス,ステータス,ロール,肌タイプ,投稿数,登録日\n'

    // CSVデータ
    const csvData = users
      .map(user => {
        const status = user.isActive ? 'アクティブ' : '停止中'
        const role =
          user.role === 'SUPER_ADMIN'
            ? 'スーパー管理者'
            : user.role === 'ADMIN'
              ? '管理者'
              : 'ユーザー'
        const createdAt = new Date(user.createdAt).toLocaleDateString('ja-JP')

        return `"${user.id}","${user.userName}","${user.email}","${status}","${role}","${user.skinType}",${user.postCount},"${createdAt}"`
      })
      .join('\n')

    const csv = csvHeader + csvData

    // 管理者ログを記録
    await logAdminAction(
      user.id,
      'USERS_EXPORT',
      undefined,
      { userCount: users.length },
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      req.headers.get('user-agent') || 'unknown'
    )

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=users_${new Date().toISOString().split('T')[0]}.csv`,
      },
    })
  } catch (error) {
    console.error('Users export error:', error)
    return NextResponse.json({ error: 'Failed to export users' }, { status: 500 })
  }
}
