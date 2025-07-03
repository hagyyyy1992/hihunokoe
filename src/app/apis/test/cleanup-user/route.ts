import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  // 本番環境では実行させない
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
  }

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // ユーザーの投稿、共感、コメントを削除してからユーザーを削除
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        posts: true,
        empathies: true,
        comments: true,
      },
    })

    if (user) {
      // 関連データを削除
      await prisma.empathy.deleteMany({
        where: { userId: user.id },
      })

      await prisma.comment.deleteMany({
        where: { userId: user.id },
      })

      await prisma.post.deleteMany({
        where: { userId: user.id },
      })

      // ユーザーを削除
      await prisma.user.delete({
        where: { id: user.id },
      })

      console.log(`Test user cleaned up: ${email}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cleaning up test user:', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
