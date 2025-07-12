import { NextRequest, NextResponse } from 'next/server'
import { AdminController } from '@api/framework/controllers/AdminController'

// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

console.log('📝📝📝 [UNPUBLISH POST STATIC ROUTE] MODULE LOADED!!! 📝📝📝', {
  timestamp: new Date().toISOString(),
  nodeEnv: process.env.NODE_ENV,
  vercelEnv: process.env.VERCEL_ENV,
  deploymentUrl: process.env.VERCEL_URL,
  fileName: __filename || 'unpublish/route.ts',
})

let adminController: AdminController | null = null

try {
  adminController = new AdminController()
  console.log('✅ [UNPUBLISH POST STATIC] AdminController initialized successfully')
} catch (error) {
  console.error('💥 [UNPUBLISH POST STATIC] Failed to initialize AdminController:', error)
}

export async function POST(request: NextRequest) {
  console.log('🎯🎯🎯 [UNPUBLISH POST STATIC] ===== POST HANDLER INVOKED ===== 🎯🎯🎯')
  console.log('📄 [UNPUBLISH POST STATIC] STATIC ROUTE REQUEST INFO:', {
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    origin: request.headers.get('origin'),
    referer: request.headers.get('referer'),
    contentType: request.headers.get('content-type'),
    authorization: request.headers.get('authorization') ? 'PRESENT' : 'MISSING',
    cookies: request.headers.get('cookie') ? 'PRESENT' : 'MISSING',
    allHeaders: Object.fromEntries(request.headers.entries()),
  })

  if (!adminController) {
    console.error('❌❌❌ [UNPUBLISH POST STATIC] CRITICAL: AdminController is NULL!!!')
    return NextResponse.json(
      { error: 'データベース接続エラーが発生しました。管理者にお問い合わせください。' },
      { status: 500 }
    )
  }

  console.log('✅ [UNPUBLISH POST STATIC] AdminController is available!')

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

    console.log('🎯 [UNPUBLISH POST STATIC] POST ID:', postId)
    console.log('🔄 [UNPUBLISH POST STATIC] CALLING adminController.unpublishPost...')

    const startTime = Date.now()
    const result = await adminController.unpublishPost(request, { params: { id: postId } })
    const endTime = Date.now()

    console.log('✨ [UNPUBLISH POST STATIC] CONTROLLER RESULT:', {
      executionTime: `${endTime - startTime}ms`,
      status: result.status,
      statusText: result.statusText,
      headers: Object.fromEntries(result.headers.entries()),
    })

    console.log('🎉 [UNPUBLISH POST STATIC] ===== HANDLER COMPLETED SUCCESSFULLY =====')
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
  console.log('⚙️⚙️⚙️ [UNPUBLISH POST STATIC - OPTIONS] PREFLIGHT REQUEST!!!', {
    timestamp: new Date().toISOString(),
    message: 'CORS preflight request received',
  })
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
