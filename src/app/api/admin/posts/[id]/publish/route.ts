import { NextRequest, NextResponse } from 'next/server'
import { AdminController } from '@api/framework/controllers/AdminController'

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
  return adminController.publishPost(request, { params })
}
