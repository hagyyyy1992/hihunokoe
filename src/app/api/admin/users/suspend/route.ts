import { NextRequest, NextResponse } from 'next/server'
import { AdminController } from '@api/framework/controllers/AdminController'

// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

console.log('🚨🚨🚨 [SUSPEND USER STATIC ROUTE] MODULE LOADED!!! 🚨🚨🚨', {
  timestamp: new Date().toISOString(),
  nodeEnv: process.env.NODE_ENV,
  vercelEnv: process.env.VERCEL_ENV,
  deploymentUrl: process.env.VERCEL_URL,
})

let adminController: AdminController | null = null

try {
  adminController = new AdminController()
  console.log('✅ [SUSPEND USER STATIC] AdminController initialized successfully')
} catch (error) {
  console.error('💥 [SUSPEND USER STATIC] Failed to initialize AdminController:', error)
}

export async function POST(request: NextRequest) {
  console.log('🔥🔥🔥 [SUSPEND USER STATIC] ===== POST HANDLER INVOKED ===== 🔥🔥🔥')
  console.log('📡 [SUSPEND USER STATIC] STATIC ROUTE REQUEST INFO:', {
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
    console.error('❌❌❌ [SUSPEND USER STATIC] CRITICAL: AdminController is NULL!!!')
    return NextResponse.json(
      { error: 'データベース接続エラーが発生しました。管理者にお問い合わせください。' },
      { status: 500 }
    )
  }

  console.log('✅ [SUSPEND USER STATIC] AdminController is available!')

  try {
    // Get user ID from URL or request body
    const url = new URL(request.url)
    let userId = url.searchParams.get('id')

    if (!userId) {
      const body = await request.json()
      userId = body.id
    }

    if (!userId) {
      console.error('❌ [SUSPEND USER STATIC] No user ID provided')
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('🎯 [SUSPEND USER STATIC] USER ID:', userId)
    console.log('🔄 [SUSPEND USER STATIC] CALLING adminController.suspendUser...')

    const startTime = Date.now()
    const result = await adminController.suspendUser(request, { params: { id: userId } })
    const endTime = Date.now()

    console.log('✨ [SUSPEND USER STATIC] CONTROLLER RESULT:', {
      executionTime: `${endTime - startTime}ms`,
      status: result.status,
      statusText: result.statusText,
      headers: Object.fromEntries(result.headers.entries()),
    })

    console.log('🎉 [SUSPEND USER STATIC] ===== HANDLER COMPLETED SUCCESSFULLY =====')
    return result
  } catch (error) {
    console.error('💥💥💥 [SUSPEND USER STATIC] FATAL ERROR:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function OPTIONS() {
  console.log('⚙️⚙️⚙️ [SUSPEND USER STATIC - OPTIONS] PREFLIGHT REQUEST!!!', {
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
