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
    const { action, resolution } = await req.json()
    const { id: reportId } = await params

    if (!action || !resolution) {
      return NextResponse.json({ error: 'Action and resolution are required' }, { status: 400 })
    }

    if (!isDatabaseAvailable()) {
      // Mock mode - just return success
      await logAdminAction(
        user.id,
        'REPORT_RESOLVE',
        reportId,
        { action, resolution },
        req.headers.get('x-forwarded-for') || 'unknown',
        req.headers.get('user-agent') || 'unknown'
      )

      return NextResponse.json({
        message: 'Report resolved successfully (mock mode)',
        reportId,
        action,
        resolution,
      })
    }

    // Update report status
    const status = action === 'resolve' ? 'RESOLVED' : 'DISMISSED'
    const report = await prisma!.report.update({
      where: { id: reportId },
      data: {
        status,
        resolvedBy: user.id,
        resolvedAt: new Date(),
        resolution,
      },
      include: {
        reporter: { select: { userName: true } },
        reported: { select: { userName: true } },
      },
    })

    // Log admin action
    await logAdminAction(
      user.id,
      'REPORT_RESOLVE',
      reportId,
      {
        action,
        resolution,
        reporterName: report.reporter.userName,
        reportedName: report.reported?.userName,
      },
      req.headers.get('x-forwarded-for') || 'unknown',
      req.headers.get('user-agent') || 'unknown'
    )

    return NextResponse.json({
      message: 'Report resolved successfully',
      report,
    })
  } catch (error) {
    console.error('Report resolution error:', error)
    return NextResponse.json({ error: 'Failed to resolve report' }, { status: 500 })
  }
}
