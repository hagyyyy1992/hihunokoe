import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ContactStatus } from '@prisma/client'
import { checkAdminAuth } from '@/lib/auth/admin-middleware'

export async function GET(request: NextRequest) {
  try {
    const adminAuth = await checkAdminAuth(request)
    if (!adminAuth.isAuthenticated || !adminAuth.admin) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'データベース接続が利用できません' }, { status: 503 })
    }

    const unreadCount = await prisma.contactInquiry.count({
      where: {
        status: ContactStatus.UNREAD,
      },
    })

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error('Failed to fetch unread count:', error)
    return NextResponse.json({ error: '未読数の取得に失敗しました' }, { status: 500 })
  }
}
