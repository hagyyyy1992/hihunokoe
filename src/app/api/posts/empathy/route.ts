import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/auth'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { MOCK_POSTS, MOCK_EMPATHIES } from '@/lib/mock-data'
import { z } from 'zod'

const empathySchema = z.object({
  empathyType: z
    .enum(['understand', 'interested', 'helpful', 'similar', 'thanks'])
    .default('helpful'),
})

// GET: ユーザーの共感状態を取得 (query parameter使用)
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

    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'トークンが無効です' }, { status: 401 })
    }

    // UUID validation for user ID
    const userUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!userUuidRegex.test(user.id)) {
      console.error('Invalid user UUID in GET:', user.id)
      return NextResponse.json({ error: 'ユーザーIDが無効です' }, { status: 400 })
    }

    if (!isDatabaseAvailable()) {
      // モックモードでの共感状態取得
      const post = MOCK_POSTS.find(p => p.id === postId && p.status === 'published')
      if (!post) {
        return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
      }

      const empathy = MOCK_EMPATHIES.find(e => e.postId === postId && e.userId === user.id)
      const totalCount = MOCK_EMPATHIES.filter(e => e.postId === postId).length

      return NextResponse.json({
        hasEmpathized: !!empathy,
        empathyType: empathy ? empathy.empathyType : undefined,
        totalCount,
      })
    }

    // データベースモードでの共感状態取得
    let post
    try {
      post = await prisma!.post.findUnique({
        where: {
          id: postId,
          isPublished: true,
        },
        select: { id: true },
      })
    } catch (dbError) {
      console.error('Database error in empathy GET:', dbError)
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
    }

    if (!post) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
    }

    let empathy
    let totalCount
    try {
      empathy = await prisma!.empathy.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: user.id,
          },
        },
      })

      totalCount = await prisma!.empathy.count({
        where: { postId },
      })
    } catch (dbError) {
      console.error('Database error in empathy operations:', dbError)
      return NextResponse.json({ error: '共感状態の取得に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({
      hasEmpathized: !!empathy,
      empathyType: empathy ? empathy.empathyType : undefined,
      totalCount,
    })
  } catch (error) {
    console.error('Empathy fetch error:', error)
    return NextResponse.json({ error: '共感状態の取得に失敗しました' }, { status: 500 })
  }
}

// POST: 共感を追加 (query parameter使用)
export async function POST(request: NextRequest) {
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

    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: 'トークンが無効です' }, { status: 401 })
    }

    // UUID validation for user ID
    const userUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!userUuidRegex.test(user.id)) {
      console.error('Invalid user UUID:', user.id)
      return NextResponse.json({ error: 'ユーザーIDが無効です' }, { status: 400 })
    }

    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError)
      return NextResponse.json({ error: 'リクエストボディが無効です' }, { status: 400 })
    }

    let empathyType
    try {
      const parsed = empathySchema.parse(body)
      empathyType = parsed.empathyType
    } catch (zodError) {
      console.error('Validation error:', zodError)
      return NextResponse.json({ error: '入力内容に誤りがあります' }, { status: 400 })
    }

    if (!isDatabaseAvailable()) {
      try {
        // モックモードでの共感追加

        const post = MOCK_POSTS.find(p => p.id === postId && p.status === 'published')

        if (!post) {
          return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
        }

        // 既存の共感をチェック

        const existingEmpathy = MOCK_EMPATHIES.find(
          e => e.postId === postId && e.userId === user.id
        )

        if (existingEmpathy) {
          return NextResponse.json({ error: '既に共感済みです' }, { status: 400 })
        }

        // 新しい共感を追加

        const newEmpathy = {
          id: `empathy-${Date.now()}`,
          postId,
          userId: user.id,
          empathyType,
          createdAt: new Date(),
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        MOCK_EMPATHIES.push(newEmpathy as any)

        // 共感数を更新

        const postIndex = MOCK_POSTS.findIndex(p => p.id === postId)
        if (postIndex !== -1) {
          MOCK_POSTS[postIndex].empathyCount += 1
        }

        const totalCount = MOCK_EMPATHIES.filter(e => e.postId === postId).length

        return NextResponse.json({
          success: true,
          empathy: newEmpathy,
          totalCount,
          message: '共感を追加しました（デモモード）',
        })
      } catch (mockError) {
        console.error('Mock mode error:', mockError)
        return NextResponse.json({ error: 'モックモードでエラーが発生しました' }, { status: 500 })
      }
    }

    // データベースモードでの共感追加

    let post
    try {
      post = await prisma!.post.findUnique({
        where: {
          id: postId,
          isPublished: true,
        },
        select: { id: true },
      })
    } catch (dbError) {
      console.error('Database error in empathy POST:', dbError)
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
    }

    if (!post) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
    }

    // 既存の共感をチェック
    let existingEmpathy
    try {
      existingEmpathy = await prisma!.empathy.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: user.id,
          },
        },
      })
    } catch (dbError) {
      console.error('Database error checking existing empathy:', dbError)
      return NextResponse.json({ error: '共感の追加に失敗しました' }, { status: 500 })
    }

    if (existingEmpathy) {
      return NextResponse.json({ error: '既に共感済みです' }, { status: 400 })
    }

    // トランザクションで共感を追加し、投稿の共感数を更新

    let result
    try {
      result = await prisma!.$transaction(async tx => {
        const empathy = await tx.empathy.create({
          data: {
            postId,
            userId: user.id,
          },
        })

        // Empathy count is calculated via relation count

        const totalCount = await tx.empathy.count({
          where: { postId },
        })

        return { empathy, totalCount }
      })
    } catch (transactionError) {
      console.error('Database transaction error:', transactionError)
      return NextResponse.json({ error: '共感の追加に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      empathy: result.empathy,
      totalCount: result.totalCount,
      message: '共感を追加しました',
    })
  } catch (error: unknown) {
    console.error('Empathy creation error:', error)
    return NextResponse.json({ error: '共感の追加に失敗しました' }, { status: 500 })
  }
}

// DELETE: 共感を削除 (query parameter使用)
export async function DELETE(request: NextRequest) {
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

    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'トークンが無効です' }, { status: 401 })
    }

    // UUID validation for user ID
    const userUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!userUuidRegex.test(user.id)) {
      console.error('Invalid user UUID in DELETE:', user.id)
      return NextResponse.json({ error: 'ユーザーIDが無効です' }, { status: 400 })
    }

    if (!isDatabaseAvailable()) {
      // モックモードでの共感削除
      const post = MOCK_POSTS.find(p => p.id === postId && p.status === 'published')
      if (!post) {
        return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
      }

      const empathyIndex = MOCK_EMPATHIES.findIndex(
        e => e.postId === postId && e.userId === user.id
      )
      if (empathyIndex === -1) {
        return NextResponse.json({ error: '共感が見つかりません' }, { status: 404 })
      }

      // 共感を削除
      MOCK_EMPATHIES.splice(empathyIndex, 1)

      // 共感数を更新
      const postIndex = MOCK_POSTS.findIndex(p => p.id === postId)
      if (postIndex !== -1) {
        MOCK_POSTS[postIndex].empathyCount = Math.max(0, MOCK_POSTS[postIndex].empathyCount - 1)
      }

      const totalCount = MOCK_EMPATHIES.filter(e => e.postId === postId).length

      return NextResponse.json({
        success: true,
        totalCount,
        message: '共感を削除しました（デモモード）',
      })
    }

    // データベースモードでの共感削除
    let post
    try {
      post = await prisma!.post.findUnique({
        where: {
          id: postId,
          isPublished: true,
        },
        select: { id: true },
      })
    } catch (dbError) {
      console.error('Database error in empathy DELETE:', dbError)
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
    }

    if (!post) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
    }

    let empathy
    try {
      empathy = await prisma!.empathy.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: user.id,
          },
        },
      })
    } catch (dbError) {
      console.error('Database error finding empathy:', dbError)
      return NextResponse.json({ error: '共感が見つかりません' }, { status: 404 })
    }

    if (!empathy) {
      return NextResponse.json({ error: '共感が見つかりません' }, { status: 404 })
    }

    // トランザクションで共感を削除し、投稿の共感数を更新
    const totalCount = await prisma!.$transaction(async tx => {
      await tx.empathy.delete({
        where: {
          postId_userId: {
            postId,
            userId: user.id,
          },
        },
      })

      // Empathy count is calculated via relation count

      return await tx.empathy.count({
        where: { postId },
      })
    })

    return NextResponse.json({
      success: true,
      totalCount,
      message: '共感を削除しました',
    })
  } catch (error) {
    console.error('Empathy deletion error:', error)
    return NextResponse.json({ error: '共感の削除に失敗しました' }, { status: 500 })
  }
}
