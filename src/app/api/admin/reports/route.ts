import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isAdmin } from '@/lib/auth/auth'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { MOCK_REPORTS } from '@/lib/mock-data'

export async function GET(req: NextRequest) {
  const token =
    req.headers.get('authorization')?.replace('Bearer ', '') || req.cookies.get('auth-token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
  }

  const user = verifyToken(token)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
  }

  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
  }

  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const reason = url.searchParams.get('reason')
  const search = url.searchParams.get('search')

  try {
    if (!isDatabaseAvailable()) {
      // Use mock data
      let filteredReports = [...MOCK_REPORTS]

      if (status && status !== 'all') {
        filteredReports = filteredReports.filter(report => report.status === status.toUpperCase())
      }

      if (reason && reason !== 'all') {
        filteredReports = filteredReports.filter(report => report.reason === reason.toUpperCase())
      }

      if (search) {
        filteredReports = filteredReports.filter(
          report =>
            report.description?.toLowerCase().includes(search.toLowerCase()) ||
            report.reporter.userName.toLowerCase().includes(search.toLowerCase()) ||
            report.reported?.userName.toLowerCase().includes(search.toLowerCase())
        )
      }

      return NextResponse.json(filteredReports)
    }

    // Database query
    const where: Record<string, unknown> = {}

    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    if (reason && reason !== 'all') {
      where.reason = reason.toUpperCase()
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { reporter: { userName: { contains: search, mode: 'insensitive' } } },
        { reported: { userName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const reports = await prisma!.report.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            userName: true,
            email: true,
          },
        },
        reported: {
          select: {
            id: true,
            userName: true,
            email: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
          },
        },
        resolver: {
          select: {
            id: true,
            userName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error('Reports fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
