import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/auth'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { MOCK_POSTS } from '@/lib/mock-data'

// DELETE: 投稿の削除 (query parameter使用)
export async function DELETE(request: NextRequest) {
  try {
    // デバッグ用ログ
    console.log('DELETE /api/posts/delete called')

    // クエリパラメータからIDを取得
    const url = new URL(request.url)
    const postId = url.searchParams.get('id')

    console.log('Post ID from query:', postId)

    if (!postId) {
      return NextResponse.json({ error: 'IDが指定されていません' }, { status: 400 })
    }

    // UUID形式の検証
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(postId)) {
      return NextResponse.json({ error: '無効なIDです' }, { status: 400 })
    }

    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'トークンが無効です' }, { status: 401 })
    }

    if (!isDatabaseAvailable()) {
      // モックモードでの投稿削除
      const postIndex = MOCK_POSTS.findIndex(p => p.id === postId)

      if (postIndex === -1) {
        return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
      }

      const post = MOCK_POSTS[postIndex]

      if (post.userId !== user.id) {
        return NextResponse.json({ error: '投稿の削除権限がありません' }, { status: 403 })
      }

      // モックデータから削除（実際には永続化されない）
      MOCK_POSTS.splice(postIndex, 1)

      return NextResponse.json({
        message: '投稿が削除されました（デモモード）',
      })
    }

    // データベースモードでの投稿削除
    const post = await prisma!.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    })

    if (!post) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
    }

    if (post.userId !== user.id) {
      return NextResponse.json({ error: '投稿の削除権限がありません' }, { status: 403 })
    }

    await prisma!.post.delete({
      where: { id: postId },
    })

    return NextResponse.json({
      message: '投稿が削除されました',
    })
  } catch (error) {
    console.error('Post deletion error:', error)
    return NextResponse.json({ error: '投稿の削除に失敗しました' }, { status: 500 })
  }
}
