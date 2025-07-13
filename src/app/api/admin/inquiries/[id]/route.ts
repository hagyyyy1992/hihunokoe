import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ContactStatus } from '@prisma/client'
import { checkAdminAuth } from '@/lib/auth/admin-middleware'

// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Explicitly define that this route uses dynamic parameters
export async function generateStaticParams() {
  return []
}

const updateSchema = z.object({
  status: z.nativeEnum(ContactStatus),
  adminNotes: z.string().optional(),
})

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    console.log('GET inquiry with ID:', params.id)

    const adminAuth = await checkAdminAuth(request)
    console.log('Admin auth result:', {
      isAuthenticated: adminAuth.isAuthenticated,
      hasAdmin: !!adminAuth.admin,
      adminId: adminAuth.admin?.id,
    })

    if (!adminAuth.isAuthenticated || !adminAuth.admin) {
      console.log('Authentication failed')
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'データベース接続が利用できません' }, { status: 503 })
    }

    const inquiry = await prisma.contactInquiry.findUnique({
      where: { id: params.id },
    })

    if (!inquiry) {
      return NextResponse.json({ error: 'お問い合わせが見つかりません' }, { status: 404 })
    }

    // 未読の場合は既読に更新
    if (inquiry.status === ContactStatus.UNREAD) {
      await prisma.contactInquiry.update({
        where: { id: params.id },
        data: { status: ContactStatus.READ },
      })
      inquiry.status = ContactStatus.READ
    }

    return NextResponse.json({ inquiry })
  } catch (error) {
    console.error('Failed to fetch inquiry:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      })
    }
    return NextResponse.json({ error: 'お問い合わせの取得に失敗しました' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const adminAuth = await checkAdminAuth(request)
    if (!adminAuth.isAuthenticated || !adminAuth.admin) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const validation = updateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'データベース接続が利用できません' }, { status: 503 })
    }

    const { status, adminNotes } = validation.data

    const inquiry = await prisma.contactInquiry.update({
      where: { id: params.id },
      data: {
        status,
        adminNotes,
        respondedAt: new Date(),
        // respondedBy: adminAuth.admin.id, // 一時的にコメントアウト
      },
    })

    // 管理ログを記録（一時的に無効化）
    // await prisma.adminLog.create({
    //   data: {
    //     adminUserId: adminAuth.admin.id,
    //     action: 'UPDATE_INQUIRY_STATUS',
    //     target: params.id,
    //     targetType: 'ContactInquiry',
    //     details: { status, adminNotes },
    //   },
    // })

    return NextResponse.json({ inquiry })
  } catch (error) {
    console.error('Failed to update inquiry:', error)

    // Prismaエラーの詳細を返す
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      })

      // Prismaの特定のエラーをチェック
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          {
            error: '管理者情報が見つかりません。再度ログインしてください。',
          },
          { status: 400 }
        )
      }

      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          {
            error: 'お問い合わせが見つかりません',
          },
          { status: 404 }
        )
      }
    }

    return NextResponse.json({ error: 'お問い合わせの更新に失敗しました' }, { status: 500 })
  }
}
