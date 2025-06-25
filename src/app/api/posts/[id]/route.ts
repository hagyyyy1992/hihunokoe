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

// GET: 投稿の取得
export async function GET(request: NextRequest) {
  // URLからIDを取得
  const segments = request.nextUrl.pathname.split('/')
  const postId = segments[segments.length - 1]

  try {
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
            profileImageUrl: true,
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

// PUT: 投稿の更新
export async function PUT(request: NextRequest) {
  const segments = request.nextUrl.pathname.split('/')
  const postId = segments[segments.length - 1]

  try {
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

// DELETE: 投稿の削除
export async function DELETE(request: NextRequest) {
  const segments = request.nextUrl.pathname.split('/')
  const postId = segments[segments.length - 1]

  try {
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
