import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ContactCategory, ContactStatus } from '@prisma/client'
import { checkAdminAuth } from '@/lib/auth/admin-middleware'

export async function GET(request: NextRequest) {
  try {
    const adminAuth = await checkAdminAuth(request)
    if (!adminAuth.isAuthenticated || !adminAuth.admin) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') as ContactStatus | null
    const category = searchParams.get('category') as ContactCategory | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    if (!prisma) {
      return NextResponse.json({ error: 'データベース接続が利用できません' }, { status: 503 })
    }

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (category) {
      where.category = category
    }

    const [inquiries, total] = await Promise.all([
      prisma.contactInquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          subject: true,
          category: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.contactInquiry.count({ where }),
    ])

    return NextResponse.json({
      inquiries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch inquiries:', error)
    return NextResponse.json({ error: 'お問い合わせ一覧の取得に失敗しました' }, { status: 500 })
  }
}
