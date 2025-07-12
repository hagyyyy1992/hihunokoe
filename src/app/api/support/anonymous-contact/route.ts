import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ContactStatus } from '@prisma/client'
import { RateLimiter, getClientIP } from '@/lib/rate-limiter'

// 匿名お問い合わせカテゴリー
const anonymousCategories = [
  'account_login',
  'account_signup',
  'account_password',
  'account_email',
  'account_other',
] as const

const anonymousContactSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(100, '名前は100文字以内で入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください').max(255),
  subject: z.string().min(1, '件名は必須です').max(200, '件名は200文字以内で入力してください'),
  category: z.enum(anonymousCategories, {
    errorMap: () => ({ message: '有効なカテゴリーを選択してください' }),
  }),
  message: z
    .string()
    .min(1, 'お問い合わせ内容は必須です')
    .max(5000, 'お問い合わせ内容は5000文字以内で入力してください'),
})

// 匿名お問い合わせ用のレート制限（IPベース、より厳しく設定）
const anonymousContactRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1時間
  maxRequests: 3, // 1時間に3回まで
})

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    const rateLimitKey = `anonymous-contact:${clientIP}`

    const { allowed, resetTime } = anonymousContactRateLimiter.checkLimit(rateLimitKey)

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'レート制限に達しました。時間をおいて再度お試しください。',
          resetTime,
        },
        { status: 429 }
      )
    }

    const body = await request.json()

    const validation = anonymousContactSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 })
    }

    const { name, email, subject, category, message } = validation.data

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    const userAgent = request.headers.get('user-agent')

    if (!prisma) {
      throw new Error('Database connection is not available')
    }

    // カテゴリーを標準的なContactCategoryにマッピング
    const contactCategory = 'account' // 全て「アカウント関連」として保存

    const inquiry = await prisma.contactInquiry.create({
      data: {
        name,
        email,
        subject: `[匿名] ${subject}`,
        category: contactCategory,
        message: `カテゴリー: ${getCategoryLabel(category)}\n\n${message}`,
        status: ContactStatus.UNREAD,
        ipAddress: ipAddress?.split(',')[0].trim() || null,
        userAgent,
        userId: null, // 匿名なのでuserIdはnull
      },
    })

    return NextResponse.json({
      success: true,
      inquiryId: inquiry.id,
    })
  } catch (error) {
    console.error('Failed to create anonymous contact inquiry:', error)
    return NextResponse.json({ error: 'お問い合わせの送信に失敗しました' }, { status: 500 })
  }
}

function getCategoryLabel(category: (typeof anonymousCategories)[number]): string {
  const labels = {
    account_login: 'ログインできない',
    account_signup: '新規登録できない',
    account_password: 'パスワードリセット問題',
    account_email: 'メール認証問題',
    account_other: 'その他のアカウント問題',
  } as const

  return labels[category]
}
