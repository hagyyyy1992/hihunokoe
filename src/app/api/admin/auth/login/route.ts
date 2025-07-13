import { NextRequest, NextResponse } from 'next/server'
import { AdminAuthController } from '@api/framework/controllers/AdminAuthController'

let adminAuthController: AdminAuthController | null = null

try {
  adminAuthController = new AdminAuthController()
} catch (error) {
  console.error('Failed to initialize AdminAuthController:', error)
}

export async function POST(request: NextRequest) {
  if (!adminAuthController) {
    console.error('AdminAuthController not available - database connection issue')
    return NextResponse.json(
      { error: 'データベース接続エラーが発生しました。管理者にお問い合わせください。' },
      { status: 500 }
    )
  }

  return adminAuthController.login(request)
}
