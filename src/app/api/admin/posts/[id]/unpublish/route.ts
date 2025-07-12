import { NextRequest, NextResponse } from 'next/server'
import { AdminController } from '@api/framework/controllers/AdminController'

// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

console.log('📝📝📝 [UNPUBLISH POST ROUTE] MODULE LOADED!!! 📝📝📝', {
  timestamp: new Date().toISOString(),
  nodeEnv: process.env.NODE_ENV,
  vercelEnv: process.env.VERCEL_ENV,
  deploymentUrl: process.env.VERCEL_URL,
  fileName: __filename || 'unpublish/route.ts',
})

let adminController: AdminController | null = null

try {
  adminController = new AdminController()
  console.log('✅ [UNPUBLISH POST] AdminController initialized successfully')
} catch (error) {
  console.error('💥 [UNPUBLISH POST] Failed to initialize AdminController:', error)
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  console.log('🎯🎯🎯 [UNPUBLISH POST] ===== POST HANDLER INVOKED ===== 🎯🎯🎯')
  console.log('📄 [UNPUBLISH POST] MEGA DETAILED REQUEST INFO:', {
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    origin: request.headers.get('origin'),
    referer: request.headers.get('referer'),
    contentType: request.headers.get('content-type'),
    contentLength: request.headers.get('content-length'),
    authorization: request.headers.get('authorization') ? 'PRESENT' : 'MISSING',
    cookies: request.headers.get('cookie') ? 'PRESENT' : 'MISSING',
    xForwardedFor: request.headers.get('x-forwarded-for'),
    vercelId: request.headers.get('x-vercel-id'),
    requestId: request.headers.get('x-request-id'),
    xMatchedPath: request.headers.get('x-matched-path'),
    vercelDeploymentUrl: request.headers.get('x-vercel-deployment-url'),
    allHeaders: Object.fromEntries(request.headers.entries()),
  })

  if (!adminController) {
    console.error('❌❌❌ [UNPUBLISH POST] CRITICAL: AdminController is NULL!!!')
    return NextResponse.json(
      { error: 'データベース接続エラーが発生しました。管理者にお問い合わせください。' },
      { status: 500 }
    )
  }

  console.log('✅ [UNPUBLISH POST] AdminController is available!')

  try {
    const params = await context.params
    console.log('🎯 [UNPUBLISH POST] EXTRACTED PARAMS:', params)
    console.log('🔄 [UNPUBLISH POST] CALLING adminController.unpublishPost...')

    const startTime = Date.now()
    const result = await adminController.unpublishPost(request, { params })
    const endTime = Date.now()

    console.log('✨ [UNPUBLISH POST] CONTROLLER RESULT:', {
      executionTime: `${endTime - startTime}ms`,
      status: result.status,
      statusText: result.statusText,
      headers: Object.fromEntries(result.headers.entries()),
    })

    console.log('🎉 [UNPUBLISH POST] ===== HANDLER COMPLETED SUCCESSFULLY =====')
    return result
  } catch (error) {
    console.error('💥💥💥 [UNPUBLISH POST] FATAL ERROR:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  console.log('🚀 [UNPUBLISH POST - PUT] ===== PUT METHOD CALLED =====', {
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
  })

  if (!adminController) {
    console.error('❌ [UNPUBLISH POST - PUT] AdminController not available')
    return NextResponse.json(
      { error: 'データベース接続エラーが発生しました。管理者にお問い合わせください。' },
      { status: 500 }
    )
  }

  const params = await context.params
  console.log('✅ [UNPUBLISH POST - PUT] Processing post ID:', params.id)
  return adminController.unpublishPost(request, { params })
}

export async function OPTIONS() {
  console.log('⚙️⚙️⚙️ [UNPUBLISH POST - OPTIONS] PREFLIGHT REQUEST!!!', {
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
