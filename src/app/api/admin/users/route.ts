import { NextRequest, NextResponse } from 'next/server'
import { AdminController } from '@api/framework/controllers/AdminController'

let adminController: AdminController | null = null

try {
  adminController = new AdminController()
} catch (error) {
  console.error('Failed to initialize AdminController:', error)
}

export async function GET(request: NextRequest) {
  if (!adminController) {
    console.error('AdminController not available - database connection issue')
    return NextResponse.json(
      { error: 'データベース接続エラーが発生しました。管理者にお問い合わせください。' },
      { status: 500 }
    )
  }

  return adminController.getUsers(request)
}
