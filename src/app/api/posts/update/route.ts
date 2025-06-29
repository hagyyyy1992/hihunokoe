import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/auth'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { MOCK_POSTS } from '@/lib/mock-data'
import { z } from 'zod'

const postSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  cosmeticName: z.string().min(1).max(200),
  cosmeticCategory: z
    .enum([
      'toner',
      'serum',
      'emulsion',
      'cream',
      'cleanser',
      'foundation',
      'concealer',
      'powder',
      'eyeshadow',
      'lipstick',
      'sunscreen',
      'other',
    ])
    .optional(),
  skinType: z.enum(['normal', 'dry', 'oily', 'combination', 'sensitive']).optional(),
  usageSituation: z
    .object({
      season: z.enum(['spring', 'summer', 'autumn', 'winter']).optional(),
      timeOfDay: z.enum(['morning', 'evening', 'both']).optional(),
      menstrualCycle: z.enum(['before', 'during', 'after', 'none']).optional(),
      skinCondition: z.enum(['good', 'unstable', 'problematic']).optional(),
      weatherCondition: z.enum(['humid', 'dry', 'hot', 'cold', 'normal']).optional(),
    })
    .optional(),
  experienceDetails: z
    .object({
      fragrance: z
        .object({
          type: z.enum(['none', 'floral', 'citrus', 'herbal', 'chemical', 'other']),
          intensity: z.enum(['weak', 'moderate', 'strong']),
          description: z.string().optional(),
        })
        .optional(),
      texture: z
        .object({
          type: z.enum(['watery', 'gel', 'cream', 'oil', 'powder', 'other']),
          spreadability: z.enum(['easy', 'moderate', 'difficult']),
          absorption: z.enum(['fast', 'moderate', 'slow']),
          description: z.string().optional(),
        })
        .optional(),
      afterUse: z
        .object({
          moisture: z.enum(['very_dry', 'dry', 'normal', 'moist', 'very_moist']),
          texture: z.enum(['rough', 'normal', 'smooth', 'very_smooth']),
          comfort: z.enum(['uncomfortable', 'normal', 'comfortable', 'very_comfortable']),
          duration: z.enum(['short', 'moderate', 'long']),
          description: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  moodTag: z.enum(['disappointed', 'okay', 'good', 'love', 'perfect']).optional(),
})

// PUT: 投稿の更新 (query parameter使用)
export async function PUT(request: NextRequest) {
  try {
    // デバッグ用ログ
    console.log('PUT /api/posts/update called')

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

    const body = await request.json()
    const validatedData = postSchema.parse(body)

    if (!isDatabaseAvailable()) {
      // モックモードでの投稿編集
      const postIndex = MOCK_POSTS.findIndex(p => p.id === postId)

      if (postIndex === -1) {
        return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
      }

      const post = MOCK_POSTS[postIndex]

      if (post.userId !== user.id) {
        return NextResponse.json({ error: '投稿の編集権限がありません' }, { status: 403 })
      }

      // 投稿を更新
      const updatedPost = {
        ...post,
        title: validatedData.title,
        content: validatedData.content,
        cosmeticName: validatedData.cosmeticName,
        cosmeticCategory: validatedData.cosmeticCategory || post.cosmeticCategory,
        skinType: validatedData.skinType || post.skinType,
        usageSituation: validatedData.usageSituation || post.usageSituation,
        experienceDetails: validatedData.experienceDetails || post.experienceDetails,
        moodTag: validatedData.moodTag || post.moodTag,
        updatedAt: new Date(),
      }

      // モックデータを更新（実際には永続化されない）
      // @ts-expect-error - モックデータの型の問題を回避
      MOCK_POSTS[postIndex] = updatedPost

      return NextResponse.json({
        post: updatedPost,
        message: '投稿が更新されました（デモモード）',
      })
    }

    // データベースモードでの投稿編集
    const post = await prisma!.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    })

    if (!post) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
    }

    if (post.userId !== user.id) {
      return NextResponse.json({ error: '投稿の編集権限がありません' }, { status: 403 })
    }

    const updatedPost = await prisma!.post.update({
      where: { id: postId },
      data: {
        title: validatedData.title,
        content: validatedData.content,
        cosmeticName: validatedData.cosmeticName,
        cosmeticCategory: validatedData.cosmeticCategory,
        skinType: validatedData.skinType,
        usageSituation: validatedData.usageSituation,
        experienceDetails: validatedData.experienceDetails,
        moodTag: validatedData.moodTag,
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
    })

    return NextResponse.json({
      post: updatedPost,
      message: '投稿が更新されました',
    })
  } catch (error: unknown) {
    console.error('Post update error:', error)

    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'ZodError' &&
      'errors' in error
    ) {
      return NextResponse.json(
        {
          error: '入力内容に誤りがあります',
          details: (error as unknown as { errors: unknown }).errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: '投稿の更新に失敗しました' }, { status: 500 })
  }
}
