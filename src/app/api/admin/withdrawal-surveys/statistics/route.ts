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

    const [total, reasonCounts, recommendCount, recommendYesCount] = await Promise.all([
      prisma.withdrawalSurvey.count({ where }),
      prisma.withdrawalSurvey.groupBy({
        by: ['reason'],
        where,
        _count: {
          reason: true,
        },
      }),
      prisma.withdrawalSurvey.count({
        where: {
          ...where,
          wouldRecommend: { not: null },
        },
      }),
      prisma.withdrawalSurvey.count({
        where: {
          ...where,
          wouldRecommend: true,
        },
      }),
    ])

    const byReason = reasonCounts.reduce(
      (acc, item) => {
        acc[item.reason] = item._count.reason
        return acc
      },
      {} as Record<string, number>
    )

    // Calculate recommendation rate (boolean to percentage)
    const recommendationRate = recommendCount > 0 ? (recommendYesCount / recommendCount) * 100 : 0

    return NextResponse.json({
      totalResponses: total,
      byReason,
      recommendationRate,
    })
  } catch (error) {
    console.error('Failed to fetch withdrawal survey statistics:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
})
