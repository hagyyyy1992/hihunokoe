import { NextRequest, NextResponse } from 'next/server'
import { AdminController } from '@api/framework/controllers/AdminController'

// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

let adminController: AdminController | null = null

try {
  adminController = new AdminController()
} catch (error) {
  console.error('💥 [UNPUBLISH POST STATIC] Failed to initialize AdminController:', error)
}
export async function POST(request: NextRequest) {
  if (!adminController) {
    console.error('❌❌❌ [UNPUBLISH POST STATIC] CRITICAL: AdminController is NULL!!!')
    return NextResponse.json(
      { error: 'データベース接続エラーが発生しました。管理者にお問い合わせください。' },
      { status: 500 }
    )
  }
  try {
    // Get post ID from URL or request body
    const url = new URL(request.url)
    let postId = url.searchParams.get('id')
    if (!postId) {
      const body = await request.json()
      postId = body.id
    }
    if (!postId) {
      console.error('❌ [UNPUBLISH POST STATIC] No post ID provided')
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }
    const result = await adminController.unpublishPost(request, { params: { id: postId } })
    return result
  } catch (error) {
    console.error('💥💥💥 [UNPUBLISH POST STATIC] FATAL ERROR:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
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
