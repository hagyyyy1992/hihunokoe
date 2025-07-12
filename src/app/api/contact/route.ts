import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ContactCategory, ContactStatus } from '@prisma/client'
import { RateLimiter, createRateLimitErrorResponse } from '@/lib/rate-limiter'
import { verifyToken } from '@/lib/auth/auth'

const contactSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(100, '名前は100文字以内で入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください').max(255),
  subject: z.string().min(1, '件名は必須です').max(200, '件名は200文字以内で入力してください'),
  category: z.nativeEnum(ContactCategory),
  message: z
    .string()
    .min(1, 'お問い合わせ内容は必須です')
    .max(5000, 'お問い合わせ内容は5000文字以内で入力してください'),
})

const contactRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15分
  maxRequests: 5,
})

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const rateLimitKey = `contact:${user.id}` // IPではなくユーザーIDベースにする

    const { allowed, resetTime } = contactRateLimiter.checkLimit(rateLimitKey)

    if (!allowed) {
      return NextResponse.json(createRateLimitErrorResponse(resetTime), { status: 429 })
    }
    const body = await request.json()

    const validation = contactSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 })
    }

    const { name, email, subject, category, message } = validation.data

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    const userAgent = request.headers.get('user-agent')

    if (!prisma) {
      throw new Error('Database connection is not available')
    }

    const inquiry = await prisma.contactInquiry.create({
      data: {
        name,
        email,
        subject,
        category,
        message,
        status: ContactStatus.UNREAD,
        ipAddress: ipAddress?.split(',')[0].trim() || null,
        userAgent,
        userId: user.id, // ログインユーザーのIDを記録
      },
    })

    return NextResponse.json({
      success: true,
      inquiryId: inquiry.id,
    })
  } catch (error) {
    console.error('Failed to create contact inquiry:', error)
    return NextResponse.json({ error: 'お問い合わせの送信に失敗しました' }, { status: 500 })
  }
}
