import { NextResponse } from 'next/server'
import { withAdminAuth, AdminRequest } from '@/lib/auth/admin-middleware'
import { prisma } from '@/lib/prisma'

export const GET = withAdminAuth(async (request: AdminRequest) => {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where = {
      ...(startDate && endDate
        ? {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }
        : {}),
    }

    const [surveys, total] = await Promise.all([
      prisma.withdrawalSurvey.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              userName: true,
            },
          },
        },
      }),
      prisma.withdrawalSurvey.count({ where }),
    ])

    return NextResponse.json({
      surveys,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Failed to fetch withdrawal surveys:', error)
    return NextResponse.json({ error: 'Failed to fetch withdrawal surveys' }, { status: 500 })
  }
})
