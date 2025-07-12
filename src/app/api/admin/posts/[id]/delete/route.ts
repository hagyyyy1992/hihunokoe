import { NextRequest, NextResponse } from 'next/server'
import { AdminController } from '@api/framework/controllers/AdminController'

// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

let adminController: AdminController | null = null

try {
  adminController = new AdminController()
} catch (error) {
  console.error('Failed to initialize AdminController:', error)
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!adminController) {
    console.error('AdminController not available - database connection issue')
    return NextResponse.json(
      { error: 'データベース接続エラーが発生しました。管理者にお問い合わせください。' },
      { status: 500 }
    )
  }

  const params = await context.params
  return adminController.deletePost(request, { params })
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!adminController) {
    console.error('AdminController not available - database connection issue')
    return NextResponse.json(
      { error: 'データベース接続エラーが発生しました。管理者にお問い合わせください。' },
      { status: 500 }
    )
  }

  const params = await context.params
  return adminController.deletePost(request, { params })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
