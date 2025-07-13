import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/auth/admin-middleware'

// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

    // ユーザーの存在確認と現在の状態取得
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, userName: true, isActive: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'ユーザーは既に停止されています' }, { status: 400 })
    }

    // ユーザーを停止
    await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      message: 'ユーザーを停止しました',
    })
  } catch (error) {
    console.error('Suspend user error:', error)
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
