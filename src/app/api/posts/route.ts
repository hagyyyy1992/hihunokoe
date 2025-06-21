import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma'
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

export async function POST(request: NextRequest) {
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

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        title: validatedData.title,
        content: validatedData.content,
        cosmeticName: validatedData.cosmeticName,
        cosmeticCategory: validatedData.cosmeticCategory,
        skinType: validatedData.skinType,
        usageSituation: validatedData.usageSituation,
        experienceDetails: validatedData.experienceDetails,
        moodTag: validatedData.moodTag,
        publishedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            displayName: true,
            skinType: true,
          },
        },
      },
    })

    return NextResponse.json({
      post,
      message: '投稿が作成されました',
    })
  } catch (error: unknown) {
    console.error('Post creation error:', error)

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

    return NextResponse.json({ error: '投稿の作成に失敗しました' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skinType = searchParams.get('skinType')
    const category = searchParams.get('category')
    const moodTag = searchParams.get('moodTag')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    const where: { [key: string]: unknown } = {
      status: 'published',
    }

    if (skinType) {
      where.skinType = skinType
    }

    if (category) {
      where.cosmeticCategory = category
    }

    if (moodTag) {
      where.moodTag = moodTag
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { cosmeticName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              displayName: true,
              skinType: true,
            },
          },
          _count: {
            select: {
              empathies: true,
              comments: true,
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ])

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Posts fetch error:', error)
    return NextResponse.json({ error: '投稿の取得に失敗しました' }, { status: 500 })
  }
}
