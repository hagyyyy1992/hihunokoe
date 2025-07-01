import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isAdmin, logAdminAction } from '@/lib/auth/auth'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  try {
    const { status } = await req.json()
    const { id: reportId } = await params

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const validStatuses = ['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    if (!isDatabaseAvailable()) {
      // Mock mode - just return success
      await logAdminAction(
        user.id,
        'REPORT_STATUS_UPDATE',
        reportId,
        { status },
        req.headers.get('x-forwarded-for') || 'unknown',
        req.headers.get('user-agent') || 'unknown'
      )

      return NextResponse.json({
        message: 'Report status updated successfully (mock mode)',
        reportId,
        status,
      })
    }

    // Update report status
    const report = await prisma!.report.update({
      where: { id: reportId },
      data: { status },
      include: {
        reporter: { select: { userName: true } },
        reported: { select: { userName: true } },
      },
    })

    // Log admin action
    await logAdminAction(
      user.id,
      'REPORT_STATUS_UPDATE',
      reportId,
      {
        status,
        reporterName: report.reporter.userName,
        reportedName: report.reported?.userName,
      },
      req.headers.get('x-forwarded-for') || 'unknown',
      req.headers.get('user-agent') || 'unknown'
    )

    return NextResponse.json({
      message: 'Report status updated successfully',
      report,
    })
  } catch (error) {
    console.error('Report status update error:', error)
    return NextResponse.json({ error: 'Failed to update report status' }, { status: 500 })
  }
}
