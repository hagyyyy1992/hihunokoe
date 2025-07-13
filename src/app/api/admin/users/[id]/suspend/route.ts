import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/auth/admin-middleware'

// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Explicitly define that this route uses dynamic parameters
export async function generateStaticParams() {
  return []
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // 管理者認証チェック
    const authResult = await verifyAdminToken(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 })
    }

    if (!prisma) {
      return NextResponse.json(
        { error: 'データベース接続エラーが発生しました。管理者にお問い合わせください。' },
        { status: 500 }
      )
    }

    const params = await context.params
    const targetUserId = params.id

    // 自分自身を停止できないようにチェック
    if (authResult.user!.id === targetUserId) {
      return NextResponse.json({ error: '自分自身を停止することはできません' }, { status: 400 })
    }

    // トランザクション内でユーザー停止と管理ログ記録を実行
    await prisma.$transaction(async tx => {
      // ユーザーの存在確認と現在の状態取得
      const user = await tx.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, userName: true, isActive: true },
      })

      if (!user) {
        throw new Error('ユーザーが見つかりません')
      }

      if (!user.isActive) {
        throw new Error('ユーザーは既に停止されています')
      }

      // ユーザーを停止
      await tx.user.update({
        where: { id: targetUserId },
        data: { isActive: false },
      })

      // 管理ログを記録
      await tx.adminLog.create({
        data: {
          adminUserId: authResult.user!.id,
          action: 'SUSPEND_USER',
          target: targetUserId,
          targetType: 'USER',
          details: {
            targetUserName: user.userName,
          },
          ipAddress:
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'ユーザーを停止しました',
    })
  } catch (error) {
    console.error('Suspend user error:', error)
    if (error instanceof Error) {
      if (
        error.message === 'ユーザーが見つかりません' ||
        error.message === 'ユーザーは既に停止されています'
      ) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
    }
    return NextResponse.json({ error: 'ユーザーの停止に失敗しました' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // POSTメソッドと同じ処理を実行
  return POST(request, context)
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
